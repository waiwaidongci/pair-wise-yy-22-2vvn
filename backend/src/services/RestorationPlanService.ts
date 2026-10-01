import { withTransaction } from "../store/jsonStore";
import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { appendAuditLog } from "../repositories/repoSupport";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { RestorationPlan } from "../models/RestorationPlan";

/**
 * 方案审批与归档状态机。
 * 关键规则：专家必须先按材料领用台账「复算实际总用量」，复算值与台账一致才能通过；
 * 档案员归档后，方案下所有领用单锁定，禁止再领用。
 */
export const restorationPlanService = {
  async list(): Promise<RestorationPlan[]> {
    return restorationPlanRepository.findAll();
  },

  /** 提交审批：DRAFT/REJECTED -> SUBMITTED。 */
  async submitForApproval(planId: number, actor: string): Promise<RestorationPlan> {
    return withTransaction((draft) => {
      const plan = restorationPlanRepository.findById(draft, planId);
      if (!plan) throw BusinessError.notFound(ERROR_CODES.PLAN_NOT_FOUND, { planId });
      if (plan.approval_status === "ARCHIVED") {
        throw new BusinessError(ERROR_CODES.PLAN_ALREADY_ARCHIVED, { planId }, 422);
      }
      plan.approval_status = "SUBMITTED";
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.RestorationPlan[1], targetType: "RestorationPlan", targetId: planId, detail: "方案提交专家审批" });
      return plan;
    });
  },

  /**
   * 专家复算后通过：recalculated_total 必须等于当前台账实际用量。
   * 这是「专家复算后才能通过方案」的强约束：
   * 专家先拿到服务端台账快照，核对影像凭证后回填复算总量，不一致直接拒绝。
   */
  async approveWithRecalculation(
    planId: number,
    recalculatedTotal: number,
    actor: string
  ): Promise<RestorationPlan> {
    const total = Number(recalculatedTotal);
    if (!Number.isFinite(total) || total < 0) {
      throw BusinessError.validation(`recalculated_total invalid: ${recalculatedTotal}`);
    }
    return withTransaction((draft) => {
      const plan = restorationPlanRepository.findById(draft, planId);
      if (!plan) throw BusinessError.notFound(ERROR_CODES.PLAN_NOT_FOUND, { planId });
      if (plan.approval_status === "ARCHIVED") {
        throw new BusinessError(ERROR_CODES.PLAN_ALREADY_ARCHIVED, { planId }, 422);
      }
      // 允许两种入口：修复师刚提交（SUBMITTED），或已批准但尚未复算台账（待专家复核）。
      const awaitingFirstApproval = plan.approval_status === "SUBMITTED";
      const approvedButUnchecked = plan.approval_status === "APPROVED" && !plan.material_rechecked;
      if (!awaitingFirstApproval && !approvedButUnchecked) {
        throw new BusinessError(ERROR_CODES.PLAN_NOT_SUBMITTED, { planId }, 422);
      }

      // 台账实际用量 = 未冲回（CONSUMED/LOCKED）且为正向的领用单合计。
      const ledgerTotal = draft.materialRequisition
        .filter(
          (req) => req.plan_id === planId && req.quantity > 0 && (req.status === "CONSUMED" || req.status === "LOCKED")
        )
        .reduce((sum, req) => sum + req.quantity, 0);

      if (total !== ledgerTotal) {
        appendAuditLog(draft, { actor, action: LOG_TEMPLATES.RestorationPlan[2], targetType: "RestorationPlan", targetId: planId, detail: `复算 ${total} 与台账 ${ledgerTotal} 不符，退回` });
        throw new BusinessError(ERROR_CODES.PLAN_RECALC_MISMATCH, { planId, recalcTotal: total, ledgerTotal }, 422);
      }

      plan.approval_status = "APPROVED";
      plan.material_rechecked = true;
      plan.recalculated_total = total;
      plan.ledger_total = ledgerTotal;
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.RestorationPlan[3], targetType: "RestorationPlan", targetId: planId, detail: `专家复算通过，总用量 ${total}` });
      return plan;
    });
  },

  async reject(planId: number, reason: string, actor: string): Promise<RestorationPlan> {
    return withTransaction((draft) => {
      const plan = restorationPlanRepository.findById(draft, planId);
      if (!plan) throw BusinessError.notFound(ERROR_CODES.PLAN_NOT_FOUND, { planId });
      if (plan.approval_status === "ARCHIVED") {
        throw new BusinessError(ERROR_CODES.PLAN_ALREADY_ARCHIVED, { planId }, 422);
      }
      plan.approval_status = "REJECTED";
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.RestorationPlan[4], targetType: "RestorationPlan", targetId: planId, detail: `方案退回：${reason || "未通过"}` });
      return plan;
    });
  },

  /**
   * 档案员归档：APPROVED -> ARCHIVED。
   * 归档动作锁定方案下全部领用单；此后任何提交用量请求都会被领用服务拒绝。
   */
  async archive(planId: number, archivistId: number, actor: string): Promise<RestorationPlan> {
    return withTransaction((draft) => {
      const plan = restorationPlanRepository.findById(draft, planId);
      if (!plan) throw BusinessError.notFound(ERROR_CODES.PLAN_NOT_FOUND, { planId });
      if (plan.approval_status === "ARCHIVED") {
        throw new BusinessError(ERROR_CODES.PLAN_ALREADY_ARCHIVED, { planId }, 422);
      }
      if (plan.approval_status !== "APPROVED") {
        throw new BusinessError(ERROR_CODES.PLAN_NOT_APPROVED, { planId }, 422);
      }
      // 专家复算通过是归档的前置条件：未复算的方案不能被档案员归档冻结。
      if (!plan.material_rechecked) {
        throw new BusinessError(ERROR_CODES.PLAN_AWAITING_RECHECK, { planId }, 422);
      }

      // 归档前要求仍有未完成步骤时给出明确拒绝（可配置严格度，此处强制全部完成）。
      const openSteps = draft.restorationStep.filter(
        (step) => step.plan_id === planId && step.execution_status !== "FINISHED"
      );
      if (openSteps.length > 0) {
        throw BusinessError.validation(`plan ${planId} still has unfinished steps: ${openSteps.map((s) => s.id).join(",")}`);
      }

      plan.approval_status = "ARCHIVED";
      plan.archived_at = new Date().toISOString();
      plan.archived_by = archivistId;

      let locked = 0;
      for (const req of draft.materialRequisition) {
        if (req.plan_id === planId && !req.locked) {
          req.locked = true;
          if (req.quantity > 0) req.status = "LOCKED";
          req.finalized_at = plan.archived_at;
          locked += 1;
        }
      }
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.RestorationPlan[5], targetType: "RestorationPlan", targetId: planId, detail: `档案员归档，锁定领用单 ${locked} 条，此后禁止领用` });
      return plan;
    });
  }
};
