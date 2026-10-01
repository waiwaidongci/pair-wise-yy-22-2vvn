import { materialBatchRepository } from "../repositories/MaterialBatchRepository";
import { materialRequisitionService } from "./MaterialRequisitionService";
import { withTransaction } from "../store/jsonStore";
import { appendAuditLog } from "../repositories/repoSupport";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import type { MaterialBatch } from "../models/MaterialBatch";

/**
 * 材料批次台账应用服务：
 * 召回/过期委托给领用链服务做级联，保证台账状态与步骤退回在同一事务。
 */
export const materialBatchService = {
  list: (): Promise<MaterialBatch[]> => materialBatchRepository.findAll(),

  create: (row: {
    batch_no: string;
    material_name: string;
    spec: string;
    total_quantity: number;
    produced_at: string;
    expires_at: string;
  }, actor: string) => {
    const total = Number(row.total_quantity);
    if (!Number.isFinite(total) || total <= 0) {
      throw BusinessError.validation(`total_quantity invalid: ${row.total_quantity}`);
    }
    return materialBatchRepository.create({ ...row, total_quantity: total, status: "ACTIVE", recalled_at: null }, actor);
  },

  recall: (batchId: number, actor: string) => materialRequisitionService.recallBatch(batchId, actor),
  expire: (batchId: number, actor: string) => materialRequisitionService.expireBatch(batchId, actor),

  /** 补货：仅合格批次可补货，同步增加总量与余量。 */
  async replenish(batchId: number, amount: number, actor: string): Promise<MaterialBatch> {
    const delta = Number(amount);
    if (!Number.isFinite(delta) || delta <= 0) {
      throw BusinessError.validation(`replenish amount invalid: ${amount}`);
    }
    return withTransaction((draft) => {
      const batch = draft.materialBatch.find((row) => row.id === batchId);
      if (!batch) throw BusinessError.notFound(ERROR_CODES.BATCH_NOT_FOUND, { batchId });
      if (batch.status !== "ACTIVE") {
        throw new BusinessError(ERROR_CODES.BATCH_INVALID, { batchId, batchStatus: batch.status }, 422);
      }
      batch.total_quantity += delta;
      batch.remaining_quantity += delta;
      batch.updated_at = new Date().toISOString();
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.MaterialBatch[1], targetType: "MaterialBatch", targetId: batchId, detail: `批次补货 ${delta}，余量 ${batch.remaining_quantity}` });
      return batch;
    });
  }
};
