import { withTransaction } from "../store/jsonStore";
import { materialRequisitionRepository } from "../repositories/MaterialRequisitionRepository";
import { materialBatchRepository } from "../repositories/MaterialBatchRepository";
import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import { appendAuditLog } from "../repositories/repoSupport";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { createRequisitionResult, type RequisitionResult } from "../constructors/RequisitionResultFactory";
import type { RequisitionSubmitPayload } from "../types/RequisitionPayload";
import type { MaterialBatch } from "../models/MaterialBatch";
import type { MaterialRequisition } from "../models/MaterialRequisition";
import type { RestorationStep } from "../models/RestorationStep";
import type { DatabaseShape } from "../models/DatabaseShape";

/**
 * 可恢复材料领用链核心服务。
 * 一条提交 = 一个 withTransaction：校验 → 幂等判定 → 批次有效性 → 影像凭证核对
 * → 并发/乐观锁 → 余量扣减 → 步骤回写 → 领用单落账 → 审计，全部同生共死。
 */

function assertQuantity(payload: RequisitionSubmitPayload): number {
  const quantity = Number(payload.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw BusinessError.validation(`quantity must be positive, got ${payload.quantity}`);
  }
  return quantity;
}

function assertBatchUsable(batch: MaterialBatch | undefined, batchId: number, quantity: number, now: number): MaterialBatch {
  if (!batch) throw BusinessError.notFound(ERROR_CODES.BATCH_NOT_FOUND, { batchId });
  if (batch.status === "RECALLED" || batch.status === "EXPIRED") {
    throw new BusinessError(ERROR_CODES.BATCH_INVALID, { batchId, batchStatus: batch.status }, 422);
  }
  if (new Date(batch.expires_at).getTime() <= now) {
    throw new BusinessError(ERROR_CODES.BATCH_INVALID, { batchId, batchStatus: "EXPIRED" }, 422);
  }
  if (batch.status === "DEPLETED" || batch.remaining_quantity < quantity) {
    throw new BusinessError(ERROR_CODES.BATCH_INSUFFICIENT, { batchId, remaining: batch.remaining_quantity, requested: quantity }, 422);
  }
  return batch;
}

/**
 * 批次失效（召回/过期）级联：未完成步骤退回重算并给出替代批次；
 * 已完成步骤保留原用量（只冻结其领用单，不退回余量）。
 * 返回受影响的「未完成」步骤 id 列表。
 */
function cascadeInvalidBatch(
  draft: DatabaseShape,
  invalidBatch: MaterialBatch,
  reason: "RECALLED" | "EXPIRED",
  actor: string
): number[] {
  const affected: number[] = [];
  const steps = draft.restorationStep.filter(
    (step) => step.batch_id === invalidBatch.id && step.execution_status !== "FINISHED"
  );

  for (const step of steps) {
    // 找到该步骤对应方案，已归档则不允许改动链路。
    const plan = draft.restorationPlan.find((row) => row.id === step.plan_id);
    if (plan?.approval_status === "ARCHIVED") continue;

    // 原领用单冲回：余量退回台账（未完成步骤的材料尚未实际消耗）。
    const liveRequisitions = draft.materialRequisition.filter(
      (req) => req.step_id === step.id && req.batch_id === invalidBatch.id && req.status === "CONSUMED" && !req.locked
    );
    for (const req of liveRequisitions) {
      invalidBatch.remaining_quantity += req.quantity;
      req.status = "REVERSED";
      req.finalized_at = new Date().toISOString();
      const reversal: Omit<MaterialRequisition, "id"> = {
        request_id: `${req.request_id}:reversal:${invalidBatch.status === "RECALLED" ? "recall" : "expire"}`,
        step_id: req.step_id,
        plan_id: req.plan_id,
        batch_id: invalidBatch.id,
        batch_version_no: req.batch_version_no,
        image_version_id: req.image_version_id,
        operator_id: req.operator_id,
        quantity: -req.quantity,
        status: "REVERSED",
        reversed_from_id: req.id,
        locked: false,
        submitted_at: new Date().toISOString(),
        finalized_at: new Date().toISOString()
      };
      materialRequisitionRepository.insert(draft, reversal);
    }

    // 步骤退回重算，清空批次选择，保留影像凭证与原用量文本供修复师参考。
    step.execution_status = "REWORK_PENDING";
    step.batch_id = null;
    step.batch_version_no = null;
    step.quantity_used = 0;
    step.lock_holder_id = null;
    step.lock_holder_name = null;
    step.base_version += 1;
    step.rework_reason = reason === "RECALLED" ? "批次被召回" : "批次已过期";
    step.updated_at = new Date().toISOString();
    affected.push(step.id);

    appendAuditLog(draft, {
      actor,
      action: LOG_TEMPLATES.RestorationStep[3],
      targetType: "RestorationStep",
      targetId: step.id,
      detail: `批次 ${invalidBatch.batch_no} ${step.rework_reason}，步骤退回重算`
    });
  }

  // 已完成步骤：不退回、不改动，仅在批次失效被引用时保留原用量（其用量本就不再可领）。
  return affected;
}

export const materialRequisitionService = {
  /** 修复师在步骤上提交批次与用量（按 request_id 幂等）。 */
  async submit(rawPayload: RequisitionSubmitPayload, actor: string): Promise<RequisitionResult> {
    const payload = rawPayload;
    const quantity = assertQuantity(payload);
    const operatorId = Number(payload.operator_id ?? 0);
    const now = Date.now();

    return withTransaction((draft) => {
      // 1) 幂等：同请求号直接回放首笔结果，绝不二次扣减。
      const existing = materialRequisitionRepository.findByRequestId(draft, payload.request_id);
      if (existing) {
        const step = restorationStepRepository.findById(draft, existing.step_id);
        const batch = draft.materialBatch.find((row) => row.id === existing.batch_id);
        appendAuditLog(draft, { actor, action: LOG_TEMPLATES.RestorationStep[2], targetType: "MaterialRequisition", targetId: existing.id, detail: `幂等回放 ${existing.request_id}` });
        return createRequisitionResult({
          idempotent: true,
          requisition: existing,
          step: step!,
          batch: batch!,
          alternatives: step && step.execution_status === "REWORK_PENDING" && batch
            ? materialBatchRepository.findAlternatives(draft, batch.material_name, quantity, batch.id)
            : []
        });
      }

      // 2) 步骤 / 方案存在性与冻结状态。
      const step = restorationStepRepository.findById(draft, Number(payload.step_id));
      if (!step) throw BusinessError.notFound(ERROR_CODES.STEP_NOT_FOUND, { stepId: payload.step_id });
      const plan = restorationPlanRepository.findById(draft, step.plan_id);
      if (!plan) throw BusinessError.notFound(ERROR_CODES.PLAN_NOT_FOUND, { planId: step.plan_id });
      if (plan.approval_status === "ARCHIVED") {
        throw new BusinessError(ERROR_CODES.ARCHIVE_FROZEN, { planId: plan.id }, 422);
      }
      if (step.execution_status === "FINISHED") {
        throw new BusinessError(ERROR_CODES.STEP_ALREADY_FINISHED, { stepId: step.id }, 422);
      }
      if (plan.approval_status !== "APPROVED") {
        throw new BusinessError(ERROR_CODES.PLAN_NOT_APPROVED, { planId: plan.id }, 422);
      }

      // 3) 并发：两名修复师同时提交同一步骤。
      //    执行锁被他人持有，或 base_version 过期（服务端已先行落过一笔），
      //    后到方一律拒绝并要求重新选择批次。
      if (step.lock_holder_id !== null && step.lock_holder_id !== operatorId) {
        throw new BusinessError(
          ERROR_CODES.STEP_LOCKED_BY_PEER,
          { stepId: step.id, operatorId: step.lock_holder_id },
          409
        );
      }
      if (payload.base_version !== step.base_version) {
        throw new BusinessError(
          ERROR_CODES.STEP_EXECUTION_CONFLICT,
          { stepId: step.id, baseVersion: payload.base_version, serverVersion: step.base_version },
          409
        );
      }

      // 4) 批次有效性（召回/过期/余量不足）。
      const batch = draft.materialBatch.find((row) => row.id === Number(payload.batch_id));
      assertBatchUsable(batch, Number(payload.batch_id), quantity, now);
      const usableBatch = batch!;

      // 5) 影像凭证核对：引用的影像版本必须属于同一步骤。
      let imageVersionId: number | null = payload.image_version_id ?? null;
      if (imageVersionId !== null && imageVersionId !== undefined) {
        const image = imageVersionRepository.findByIdInDraft(draft, Number(imageVersionId));
        if (!image) {
          throw new BusinessError(ERROR_CODES.STEP_IMAGE_VERSION_REQUIRED, { stepId: step.id }, 400);
        }
        if (image.step_id !== step.id) {
          throw new BusinessError(ERROR_CODES.STEP_IMAGE_MISMATCH, { imageVersionId: image.id, stepId: step.id }, 422);
        }
        imageVersionId = image.id;
      }

      // 6) 扣减台账余量并维护批次版本。
      usableBatch.remaining_quantity -= quantity;
      if (usableBatch.remaining_quantity === 0) usableBatch.status = "DEPLETED";
      usableBatch.updated_at = new Date().toISOString();
      const batchVersionNo = (step.batch_version_no ?? 0) + 1;

      // 7) 领用单落账。
      const requisition = materialRequisitionRepository.insert(draft, {
        request_id: payload.request_id,
        step_id: step.id,
        plan_id: plan.id,
        batch_id: usableBatch.id,
        batch_version_no: batchVersionNo,
        image_version_id: imageVersionId,
        operator_id: operatorId,
        quantity,
        status: "CONSUMED",
        reversed_from_id: null,
        locked: false,
        submitted_at: new Date().toISOString(),
        finalized_at: null
      });

      // 8) 步骤回写：选定批次/用量/凭证，退出重算态并推进乐观版本。
      step.batch_id = usableBatch.id;
      step.batch_version_no = batchVersionNo;
      step.quantity_used = quantity;
      step.image_version_id = imageVersionId;
      step.operator_id = operatorId;
      step.execution_status = "PENDING";
      step.rework_reason = null;
      step.lock_holder_id = null;
      step.lock_holder_name = null;
      step.base_version += 1;
      step.step_status = "MATERIAL_CONSUMED";
      step.updated_at = new Date().toISOString();

      appendAuditLog(draft, {
        actor,
        action: LOG_TEMPLATES.RestorationStep[1],
        targetType: "MaterialRequisition",
        targetId: requisition.id,
        detail: `步骤${step.id} 领用批次 ${usableBatch.batch_no} 用量 ${quantity}，余量 ${usableBatch.remaining_quantity}`
      });

      const alternatives = materialBatchRepository.findAlternatives(draft, usableBatch.material_name, quantity, usableBatch.id);
      return createRequisitionResult({ idempotent: false, requisition, step, batch: usableBatch, alternatives });
    });
  },

  /**
   * 批次召回：失效级联。未完成步骤退回重算并给替代批次；
   * 已完成步骤与已归档方案保留原用量。
   */
  async recallBatch(batchId: number, actor: string): Promise<{ batch: MaterialBatch; affected_steps: number[]; alternatives: MaterialBatch[] }> {
    return withTransaction((draft) => {
      const batch = materialBatchRepository.findById(draft, batchId);
      if (!batch) throw BusinessError.notFound(ERROR_CODES.BATCH_NOT_FOUND, { batchId });
      batch.status = "RECALLED";
      batch.recalled_at = new Date().toISOString();
      batch.updated_at = batch.recalled_at;
      const affectedSteps = cascadeInvalidBatch(draft, batch, "RECALLED", actor);
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.MaterialBatch[2], targetType: "MaterialBatch", targetId: batchId, detail: `批次召回 ${batch.batch_no}，退回步骤 ${affectedSteps.join(",") || "无"}` });
      return { batch, affected_steps: affectedSteps, alternatives: materialBatchRepository.findAlternatives(draft, batch.material_name, 1, batchId) };
    });
  },

  /** 批次过期：同召回级联。 */
  async expireBatch(batchId: number, actor: string): Promise<{ batch: MaterialBatch; affected_steps: number[]; alternatives: MaterialBatch[] }> {
    return withTransaction((draft) => {
      const batch = materialBatchRepository.findById(draft, batchId);
      if (!batch) throw BusinessError.notFound(ERROR_CODES.BATCH_NOT_FOUND, { batchId });
      batch.status = "EXPIRED";
      batch.updated_at = new Date().toISOString();
      const affectedSteps = cascadeInvalidBatch(draft, batch, "EXPIRED", actor);
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.MaterialBatch[3], targetType: "MaterialBatch", targetId: batchId, detail: `批次过期 ${batch.batch_no}，退回步骤 ${affectedSteps.join(",") || "无"}` });
      return { batch, affected_steps: affectedSteps, alternatives: materialBatchRepository.findAlternatives(draft, batch.material_name, 1, batchId) };
    });
  },

  /**
   * 旧步骤补齐：没有批次版本的历史步骤，按当前合格台账补齐批次引用。
   * 仅在方案未归档、步骤未完成时补齐；不追溯扣减历史用量（历史无领用记录）。
   */
  async backfillStep(stepId: number, preferredBatchId: number | null, actor: string): Promise<RestorationStep> {
    return withTransaction((draft) => {
      const step = restorationStepRepository.findById(draft, stepId);
      if (!step) throw BusinessError.notFound(ERROR_CODES.STEP_NOT_FOUND, { stepId });
      const plan = restorationPlanRepository.findById(draft, step.plan_id);
      if (plan?.approval_status === "ARCHIVED") {
        throw new BusinessError(ERROR_CODES.STEP_LOCKED_BY_ARCHIVE, { stepId, planId: plan.id }, 422);
      }
      if (step.batch_id !== null) return step; // 已有批次版本，无需补齐。

      const candidates = draft.materialBatch
        .filter((batch) => batch.status === "ACTIVE" && batch.remaining_quantity > 0)
        .sort((a, b) => a.expires_at.localeCompare(b.expires_at));
      const preferred = preferredBatchId !== null ? candidates.find((batch) => batch.id === preferredBatchId) : undefined;
      const batch = preferred ?? candidates[0];
      if (!batch) throw new BusinessError(ERROR_CODES.BATCH_NOT_FOUND, { batchId: preferredBatchId ?? 0 }, 422);

      step.batch_id = batch.id;
      step.batch_version_no = 1;
      step.execution_status = "PENDING";
      step.base_version += 1;
      step.updated_at = new Date().toISOString();
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.MaterialBatch[4], targetType: "RestorationStep", targetId: step.id, detail: `旧步骤按当前台账补齐批次 ${batch.batch_no}` });
      return step;
    });
  },

  /** 读取某方案的领用链台账（专家复算/前端核对用）。 */
  async chainByPlan(planId: number) {
    const steps = await restorationStepRepository.findByPlan(planId);
    const requisitions = await materialRequisitionRepository.findByPlan(planId);
    const batches = await materialBatchRepository.findAll();
    const batchMap = new Map(batches.map((batch) => [batch.id, batch]));
    const consumedTotal = requisitions
      .filter((req) => req.quantity > 0 && (req.status === "CONSUMED" || req.status === "LOCKED"))
      .reduce((sum, req) => sum + req.quantity, 0);
    return {
      plan_id: planId,
      ledger_total: consumedTotal,
      steps,
      requisitions,
      batches: batches.filter((batch) => requisitions.some((req) => req.batch_id === batch.id)),
      batchMap
    };
  }
};
