import type { MaterialBatch } from "../models/MaterialBatch";
import type { MaterialRequisition } from "../models/MaterialRequisition";
import type { RestorationStep } from "../models/RestorationStep";

/**
 * 领用提交响应构造器：service 不直接散写响应结构，
 * 「替代批次」与「退回重算」信息在此统一成形，前端据此提示修复师重选。
 */
export interface RequisitionResult {
  idempotent: boolean;
  requisition: MaterialRequisition;
  step: RestorationStep;
  batch: Pick<MaterialBatch, "id" | "batch_no" | "material_name" | "remaining_quantity" | "status">;
  alternatives: MaterialBatch[];
  rework: {
    triggered: boolean;
    reason: string | null;
    affected_step_ids: number[];
  };
}

export const createRequisitionResult = (params: {
  idempotent: boolean;
  requisition: MaterialRequisition;
  step: RestorationStep;
  batch: MaterialBatch;
  alternatives?: MaterialBatch[];
  rework?: { triggered: boolean; reason: string | null; affected_step_ids: number[] };
}): RequisitionResult => ({
  idempotent: params.idempotent,
  requisition: params.requisition,
  step: params.step,
  batch: {
    id: params.batch.id,
    batch_no: params.batch.batch_no,
    material_name: params.batch.material_name,
    remaining_quantity: params.batch.remaining_quantity,
    status: params.batch.status
  },
  alternatives: params.alternatives ?? [],
  rework: params.rework ?? { triggered: false, reason: null, affected_step_ids: [] }
});
