import type { RestorationStep } from "./RestorationStep";
import type { MaterialBatch } from "./MaterialBatch";

export interface MaterialRequisition {
  id: number;
  request_no: string;
  step_id: number;
  plan_id: number;
  batch_id: number;
  qty: number;
  operator_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitRequisitionResult {
  idempotent: boolean;
  requisition: MaterialRequisition;
  step: RestorationStep;
  batch: MaterialBatch;
  alternatives?: MaterialBatch[];
}
