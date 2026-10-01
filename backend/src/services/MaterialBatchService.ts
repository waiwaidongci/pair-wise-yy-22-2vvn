import { materialBatchRepository } from "../repositories/MaterialBatchRepository";
import { materialRequisitionService } from "./MaterialRequisitionService";
import type { MaterialBatch } from "../models/MaterialBatch";

export const materialBatchService = {
  list(): MaterialBatch[] {
    return materialBatchRepository.findAll();
  },

  get(id: number): MaterialBatch | undefined {
    return materialBatchRepository.findById(id);
  },

  create(row: Partial<MaterialBatch>): MaterialBatch {
    return materialBatchRepository.save(row);
  },

  /** 召回批次：未完成步骤退回重算，给出替代批次。 */
  recall(id: number) {
    return materialRequisitionService.invalidateBatch(id, "recall");
  },

  /** 过期批次：未完成步骤退回重算。 */
  expire(id: number) {
    return materialRequisitionService.invalidateBatch(id, "expire");
  },

  /** 耗尽批次：未完成步骤退回重算。 */
  deplete(id: number) {
    return materialRequisitionService.invalidateBatch(id, "deplete");
  },

  /** 某步骤的替代批次建议。 */
  alternatives(stepId: number, qty: number): MaterialBatch[] {
    return materialRequisitionService.suggestAlternatives(stepId, qty);
  }
};
