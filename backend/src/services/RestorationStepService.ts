import { withTransaction } from "../store/jsonStore";
import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import { materialRequisitionRepository } from "../repositories/MaterialRequisitionRepository";
import { appendAuditLog } from "../repositories/repoSupport";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { RestorationStep } from "../models/RestorationStep";

/**
 * 修复步骤执行服务：执行锁、完成质检。
 * 步骤完成必须携带该步骤的影像凭证版本；完成后用量与批次永久保留，
 * 后续批次召回/过期也不会冲回。
 */
export const restorationStepService = {
  async list(): Promise<RestorationStep[]> {
    return restorationStepRepository.findAll();
  },

  /** 修复师进入步骤时获取执行锁（两名修复师并发的第一道闸）。 */
  async acquireLock(stepId: number, operatorId: number, operatorName: string, actor: string): Promise<RestorationStep> {
    return withTransaction((draft) => {
      const step = restorationStepRepository.findById(draft, stepId);
      if (!step) throw BusinessError.notFound(ERROR_CODES.STEP_NOT_FOUND, { stepId });
      if (step.execution_status === "FINISHED") {
        throw new BusinessError(ERROR_CODES.STEP_ALREADY_FINISHED, { stepId }, 422);
      }
      if (step.lock_holder_id !== null && step.lock_holder_id !== operatorId) {
        throw new BusinessError(ERROR_CODES.STEP_LOCKED_BY_PEER, { stepId, operatorId }, 409);
      }
      step.lock_holder_id = operatorId;
      step.lock_holder_name = operatorName;
      step.updated_at = new Date().toISOString();
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.RestorationStep[1], targetType: "RestorationStep", targetId: stepId, detail: `${operatorName} 获取步骤执行锁` });
      return step;
    });
  },

  /**
   * 完成步骤：必须已领用材料（有生效 CONSUMED 单）且影像凭证属于本步骤。
   * FINISHED 之后：execution_status 锁定，用量成为历史事实，批次失效不再级联。
   */
  async finish(stepId: number, imageVersionId: number, operatorId: number, actor: string): Promise<RestorationStep> {
    return withTransaction((draft) => {
      const step = restorationStepRepository.findById(draft, stepId);
      if (!step) throw BusinessError.notFound(ERROR_CODES.STEP_NOT_FOUND, { stepId });
      const plan = restorationPlanRepository.findById(draft, step.plan_id);
      if (plan?.approval_status === "ARCHIVED") {
        throw new BusinessError(ERROR_CODES.STEP_LOCKED_BY_ARCHIVE, { stepId, planId: plan.id }, 422);
      }
      if (step.execution_status === "FINISHED") {
        throw new BusinessError(ERROR_CODES.STEP_ALREADY_FINISHED, { stepId }, 422);
      }

      // 必须有未冲回的生效领用记录。
      const hasLiveConsumption = draft.materialRequisition.some(
        (req) => req.step_id === stepId && req.quantity > 0 && (req.status === "CONSUMED" || req.status === "LOCKED")
      );
      if (!hasLiveConsumption) {
        throw BusinessError.validation(`step ${stepId} has no consumed material, requisition first`);
      }

      const image = imageVersionRepository.findByIdInDraft(draft, imageVersionId);
      if (!image) {
        throw new BusinessError(ERROR_CODES.STEP_IMAGE_VERSION_REQUIRED, { stepId }, 400);
      }
      if (image.step_id !== stepId) {
        throw new BusinessError(ERROR_CODES.STEP_IMAGE_MISMATCH, { imageVersionId, stepId }, 422);
      }

      const ts = new Date().toISOString();
      step.execution_status = "FINISHED";
      step.step_status = "FINISHED";
      step.finished_at = ts;
      step.image_version_id = imageVersionId;
      step.operator_id = operatorId;
      step.lock_holder_id = null;
      step.lock_holder_name = null;
      step.base_version += 1;
      step.updated_at = ts;

      // 已完成步骤的领用单随步骤定型（用量事实保留），归档时再统一 LOCKED。
      for (const req of draft.materialRequisition) {
        if (req.step_id === stepId && req.quantity > 0 && req.status === "CONSUMED") {
          req.finalized_at = ts;
        }
      }

      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.RestorationStep[4], targetType: "RestorationStep", targetId: stepId, detail: `步骤质检完成，影像凭证版本 ${imageVersionId}，用量 ${step.quantity_used} 保留` });
      return step;
    });
  },

  async releaseLock(stepId: number, actor: string): Promise<RestorationStep> {
    return withTransaction((draft) => {
      const step = restorationStepRepository.findById(draft, stepId);
      if (!step) throw BusinessError.notFound(ERROR_CODES.STEP_NOT_FOUND, { stepId });
      step.lock_holder_id = null;
      step.lock_holder_name = null;
      step.updated_at = new Date().toISOString();
      return step;
    });
  },

  async chainByPlan(planId: number) {
    return materialRequisitionServiceChain(planId);
  }
};

// 避免与领用服务循环依赖，这里走仓储直读组装链路。
async function materialRequisitionServiceChain(planId: number) {
  const steps = await restorationStepRepository.findByPlan(planId);
  const requisitions = await materialRequisitionRepository.findByPlan(planId);
  return { steps, requisitions };
}
