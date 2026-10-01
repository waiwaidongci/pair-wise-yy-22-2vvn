import { materialBatchRepository } from "../repositories/MaterialBatchRepository";
import { materialRequisitionRepository } from "../repositories/MaterialRequisitionRepository";
import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import { HttpError } from "../utils/httpError";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { MaterialBatch } from "../models/MaterialBatch";
import type { MaterialRequisition } from "../models/MaterialRequisition";
import type { RestorationStep } from "../models/RestorationStep";
import type { RestorationPlan } from "../models/RestorationPlan";

const COMPLETED_STEP_STATUSES = new Set(["APPROVED", "COMPLETED", "FINISHED", "ARCHIVED"]);
const TERMINAL_PLAN_STATUSES = new Set(["ARCHIVED"]);

const nowIso = (): string => new Date().toISOString();

const isStepCompleted = (step: RestorationStep): boolean =>
  COMPLETED_STEP_STATUSES.has(String(step.step_status).toUpperCase());

const isPlanArchived = (plan: RestorationPlan): boolean =>
  TERMINAL_PLAN_STATUSES.has(String(plan.approval_status).toUpperCase()) || Boolean(plan.archived_at);

const isBatchExpired = (batch: MaterialBatch): boolean => {
  if (!batch.expiry_date) return false;
  const expiry = new Date(batch.expiry_date).getTime();
  return Number.isFinite(expiry) && expiry < Date.now();
};

const isBatchUsable = (batch: MaterialBatch): boolean =>
  batch.status === "ACTIVE" && !isBatchExpired(batch) && batch.remaining_qty > 0;

/** 从 material_used 文本里粗略解析用量，解析不到给 1。 */
const parseQty = (raw: unknown): number => {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const matched = raw.match(/(\d+(?:\.\d+)?)/);
    if (matched) return Number(matched[1]);
  }
  return 1;
};

export interface SubmitRequisitionInput {
  step_id: number;
  batch_id: number;
  qty: number;
  request_no: string;
  operator_id?: number;
  base_ledger_version?: number;
}

export interface InvalidateResult {
  batch: MaterialBatch;
  rolledBack: Array<{ step: RestorationStep; requisition: MaterialRequisition }>;
  preserved: Array<{ step: RestorationStep; requisition: MaterialRequisition; reason: string }>;
  alternatives: Record<number, MaterialBatch[]>;
}

export interface RecalcResult {
  plan: RestorationPlan;
  ok: boolean;
  issues: Array<{ step_id: number; code: string; message: string }>;
}

export const materialRequisitionService = {
  /** 领用台账列表。 */
  list(): MaterialRequisition[] {
    return materialRequisitionRepository.findAll();
  },

  /** 提交领用：按剩余量扣减，按请求号幂等。 */
  submit(input: SubmitRequisitionInput): {
    idempotent: boolean;
    requisition: MaterialRequisition;
    step: RestorationStep;
    batch: MaterialBatch;
    alternatives?: MaterialBatch[];
  } {
    const requestNo = String(input.request_no ?? "").trim();
    if (!requestNo) {
      throw new HttpError(400, ERROR_CODES.VALIDATION_FAILED, "请求号不能为空");
    }

    // 幂等：同一请求号只生效一次，重试不重复扣减。
    const existing = materialRequisitionRepository.findByRequestNo(requestNo);
    if (existing) {
      const step = restorationStepRepository.findById(existing.step_id);
      const batch = materialBatchRepository.findById(existing.batch_id);
      return { idempotent: true, requisition: existing, step: step!, batch: batch! };
    }

    const stepId = Number(input.step_id);
    const batchId = Number(input.batch_id);
    const qty = Number(input.qty);
    if (!Number.isFinite(stepId) || !Number.isFinite(batchId) || !Number.isFinite(qty) || qty <= 0) {
      throw new HttpError(400, ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }

    const step = restorationStepRepository.findById(stepId);
    if (!step) throw new HttpError(404, ERROR_CODES.STEP_NOT_FOUND, ERROR_MESSAGES.STEP_NOT_FOUND);

    const plan = restorationPlanRepository.findById(Number(step.plan_id));
    if (!plan) throw new HttpError(404, ERROR_CODES.PLAN_NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);
    if (isPlanArchived(plan)) {
      throw new HttpError(409, ERROR_CODES.PLAN_ARCHIVED, ERROR_MESSAGES.PLAN_ARCHIVED);
    }
    if (isStepCompleted(step)) {
      throw new HttpError(409, ERROR_CODES.STEP_COMPLETED, ERROR_MESSAGES.STEP_COMPLETED);
    }

    // 并发冲突：后到方重新选择批次。
    if (
      input.base_ledger_version !== undefined &&
      Number(input.base_ledger_version) !== Number(step.ledger_version)
    ) {
      const alternatives = this.suggestAlternatives(stepId, qty);
      throw new HttpError(409, ERROR_CODES.REQUISITION_CONFLICT, ERROR_MESSAGES.REQUISITION_CONFLICT, {
        current_step: restorationStepRepository.findById(stepId),
        alternatives
      });
    }

    const batch = materialBatchRepository.findById(batchId);
    if (!batch) throw new HttpError(404, ERROR_CODES.BATCH_NOT_FOUND, ERROR_MESSAGES.BATCH_NOT_FOUND);

    if (batch.status !== "ACTIVE") {
      const alternatives = this.suggestAlternatives(stepId, qty);
      throw new HttpError(409, ERROR_CODES.BATCH_INACTIVE, ERROR_MESSAGES.BATCH_INACTIVE, { alternatives });
    }
    if (isBatchExpired(batch)) {
      materialBatchRepository.update(batchId, { status: "EXPIRED" });
      const alternatives = this.suggestAlternatives(stepId, qty);
      throw new HttpError(409, ERROR_CODES.BATCH_EXPIRED, ERROR_MESSAGES.BATCH_EXPIRED, { alternatives });
    }
    if (batch.remaining_qty < qty) {
      const alternatives = this.suggestAlternatives(stepId, qty);
      throw new HttpError(409, ERROR_CODES.BATCH_INSUFFICIENT, ERROR_MESSAGES.BATCH_INSUFFICIENT, { alternatives });
    }

    // 扣减并落台账。
    const updatedBatch = materialBatchRepository.update(batchId, {
      remaining_qty: batch.remaining_qty - qty,
      status: batch.remaining_qty - qty <= 0 ? "DEPLETED" : batch.status
    })!;

    const requisition = materialRequisitionRepository.save({
      request_no: requestNo,
      step_id: stepId,
      plan_id: Number(step.plan_id),
      batch_id: batchId,
      qty,
      operator_id: Number(input.operator_id ?? step.operator_id ?? 1),
      status: "CONFIRMED",
      created_at: nowIso(),
      updated_at: nowIso()
    });

    const confirmedQty = materialRequisitionRepository
      .findByStep(stepId)
      .filter((row) => row.status === "CONFIRMED")
      .reduce((sum, row) => sum + Number(row.qty), 0);

    const updatedStep = restorationStepRepository.update(stepId, {
      material_batch_id: batchId,
      material_qty: confirmedQty,
      requisition_status: "CONFIRMED",
      ledger_version: Number(step.ledger_version) + 1
    })!;

    return { idempotent: false, requisition, step: updatedStep, batch: updatedBatch };
  },

  /** 批次失效：未完成步骤退回重算，已完成步骤与归档方案保留原用量。 */
  invalidateBatch(batchId: number, reason: "recall" | "expire" | "deplete"): InvalidateResult {
    const batch = materialBatchRepository.findById(batchId);
    if (!batch) throw new HttpError(404, ERROR_CODES.BATCH_NOT_FOUND, ERROR_MESSAGES.BATCH_NOT_FOUND);

    const nextStatus = reason === "recall" ? "RECALLED" : reason === "expire" ? "EXPIRED" : "DEPLETED";
    const updatedBatch = materialBatchRepository.update(batchId, { status: nextStatus })!;

    const confirmed = materialRequisitionRepository.findConfirmedByBatch(batchId);
    const rolledBack: InvalidateResult["rolledBack"] = [];
    const preserved: InvalidateResult["preserved"] = [];
    const alternatives: Record<number, MaterialBatch[]> = {};

    for (const requisition of confirmed) {
      const step = restorationStepRepository.findById(Number(requisition.step_id));
      if (!step) continue;
      const plan = restorationPlanRepository.findById(Number(step.plan_id));
      const archived = plan ? isPlanArchived(plan) : false;
      const completed = isStepCompleted(step);

      if (archived || completed) {
        preserved.push({
          step,
          requisition,
          reason: archived ? "方案已归档，保留原用量" : "步骤已完成，保留原用量"
        });
        continue;
      }

      // 退回：释放步骤批次版本，领用记录置为已回滚。
      materialRequisitionRepository.update(Number(requisition.id), {
        status: "ROLLED_BACK",
        updated_at: nowIso()
      });
      const updatedStep = restorationStepRepository.update(Number(step.id), {
        material_batch_id: null,
        material_qty: 0,
        requisition_status: "ROLLED_BACK",
        ledger_version: Number(step.ledger_version) + 1
      })!;
      rolledBack.push({ step: updatedStep, requisition });
      alternatives[Number(step.id)] = this.suggestAlternatives(Number(step.id), Number(requisition.qty));
    }

    return { batch: updatedBatch, rolledBack, preserved, alternatives };
  },

  /** 给出替代批次：可用、未过期、余量满足，按余量从大到小。 */
  suggestAlternatives(stepId: number, qty: number): MaterialBatch[] {
    const step = restorationStepRepository.findById(stepId);
    const planId = step ? Number(step.plan_id) : 0;
    return materialBatchRepository
      .findAll()
      .filter((batch) => isBatchUsable(batch) && batch.remaining_qty >= qty)
      .sort((a, b) => b.remaining_qty - a.remaining_qty)
      .map((batch) => ({ ...batch }));
  },

  /** 专家复算：核对步骤批次版本、影像凭证与台账一致性。 */
  recalculatePlan(planId: number): RecalcResult {
    const plan = restorationPlanRepository.findById(planId);
    if (!plan) throw new HttpError(404, ERROR_CODES.PLAN_NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);

    const steps = restorationStepRepository.findByPlan(planId);
    const issues: RecalcResult["issues"] = [];

    for (const step of steps) {
      if (isPlanArchived(plan) || isStepCompleted(step)) continue;

      if (step.requisition_status !== "CONFIRMED" || !step.material_batch_id) {
        issues.push({
          step_id: Number(step.id),
          code: "STEP_NEEDS_REQUISITION",
          message: `步骤 ${step.id} 尚未确认领用，请选择批次`
        });
        continue;
      }

      const batch = materialBatchRepository.findById(Number(step.material_batch_id));
      if (!batch || batch.status !== "ACTIVE" || isBatchExpired(batch)) {
        issues.push({
          step_id: Number(step.id),
          code: "BATCH_INVALID",
          message: `步骤 ${step.id} 批次已失效，请重新选择`
        });
        continue;
      }

      const evidence = imageVersionRepository.findByRequisition(
        materialRequisitionRepository
          .findByStep(Number(step.id))
          .filter((row) => row.status === "CONFIRMED")
          .reduce((max, row) => Math.max(max, Number(row.id)), 0)
      );
      if (evidence.length === 0) {
        issues.push({
          step_id: Number(step.id),
          code: ERROR_CODES.IMAGE_EVIDENCE_MISSING,
          message: ERROR_MESSAGES.IMAGE_EVIDENCE_MISSING
        });
      }
    }

    // 台账一致性：批次剩余量 = 总量 - 已确认领用量。
    for (const batch of materialBatchRepository.findAll()) {
      const confirmedQty = materialRequisitionRepository
        .findConfirmedByBatch(Number(batch.id))
        .reduce((sum, row) => sum + Number(row.qty), 0);
      const expected = Number(batch.total_qty) - confirmedQty;
      if (expected !== Number(batch.remaining_qty)) {
        issues.push({
          step_id: 0,
          code: ERROR_CODES.LEDGER_INCONSISTENT,
          message: `批次 ${batch.batch_no} 台账不一致：期望余量 ${expected}，实际 ${batch.remaining_qty}`
        });
      }
    }

    if (issues.length === 0) {
      const updated = restorationPlanRepository.update(planId, {
        recalc_status: "RECALCULATED",
        ledger_version: Number(plan.ledger_version) + 1
      })!;
      return { plan: updated, ok: true, issues: [] };
    }
    return { plan, ok: false, issues };
  },

  /** 专家审批通过：必须先复算。 */
  approvePlan(planId: number): RestorationPlan {
    const plan = restorationPlanRepository.findById(planId);
    if (!plan) throw new HttpError(404, ERROR_CODES.PLAN_NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);
    if (isPlanArchived(plan)) {
      throw new HttpError(409, ERROR_CODES.PLAN_ARCHIVED, ERROR_MESSAGES.PLAN_ARCHIVED);
    }
    if (plan.recalc_status !== "RECALCULATED") {
      throw new HttpError(409, ERROR_CODES.PLAN_NOT_RECALCULATED, ERROR_MESSAGES.PLAN_NOT_RECALCULATED);
    }
    return restorationPlanRepository.update(planId, { approval_status: "APPROVED" })!;
  },

  /** 档案员归档：归档后禁止领用。 */
  archivePlan(planId: number): RestorationPlan {
    const plan = restorationPlanRepository.findById(planId);
    if (!plan) throw new HttpError(404, ERROR_CODES.PLAN_NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);
    return restorationPlanRepository.update(planId, {
      approval_status: "ARCHIVED",
      archived_at: nowIso()
    })!;
  },

  /** 补齐：旧步骤没有批次版本时按当前台账补齐。 */
  backfillSteps(): { backfilled: number; steps: RestorationStep[] } {
    const steps = restorationStepRepository
      .findAll()
      .filter((step) => !step.material_batch_id || step.requisition_status === "NONE");

    const backfilled: RestorationStep[] = [];
    for (const step of steps) {
      const plan = restorationPlanRepository.findById(Number(step.plan_id));
      if (plan && isPlanArchived(plan)) continue;

      const qty = parseQty(step.material_used);
      const candidates = materialBatchRepository
        .findAll()
        .filter((batch) => isBatchUsable(batch))
        .sort((a, b) => b.remaining_qty - a.remaining_qty);
      const target = candidates[0];
      if (!target) continue;

      materialBatchRepository.update(Number(target.id), {
        remaining_qty: target.remaining_qty - qty,
        status: target.remaining_qty - qty <= 0 ? "DEPLETED" : target.status
      });

      materialRequisitionRepository.save({
        request_no: `BACKFILL-${step.id}-${Date.now()}`,
        step_id: Number(step.id),
        plan_id: Number(step.plan_id),
        batch_id: Number(target.id),
        qty,
        operator_id: Number(step.operator_id ?? 1),
        status: "CONFIRMED",
        created_at: nowIso(),
        updated_at: nowIso()
      });

      const confirmedQty = materialRequisitionRepository
        .findByStep(Number(step.id))
        .filter((row) => row.status === "CONFIRMED")
        .reduce((sum, row) => sum + Number(row.qty), 0);

      const updated = restorationStepRepository.update(Number(step.id), {
        material_batch_id: Number(target.id),
        material_qty: confirmedQty,
        requisition_status: "CONFIRMED",
        ledger_version: Number(step.ledger_version) + 1
      })!;
      backfilled.push(updated);
    }

    return { backfilled: backfilled.length, steps: backfilled };
  }
};
