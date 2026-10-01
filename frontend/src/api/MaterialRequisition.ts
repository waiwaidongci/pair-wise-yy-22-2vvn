import { http } from "./http";
import type { RequisitionResult, RequisitionSubmitPayload } from "../types/MaterialRequisition";
import type { MaterialRequisition } from "../types/MaterialRequisition";
import type { RestorationStep } from "../types/RestorationStep";
import type { MaterialBatch } from "../types/MaterialBatch";

const endpoint = "/material-requisition";

/** 提交批次用量：服务端按 request_id 幂等，重试安全。 */
export const submitRequisition = (payload: RequisitionSubmitPayload, options?: { role?: string; operatorName?: string }) =>
  http.post<RequisitionResult>(endpoint, payload, {
    role: options?.role ?? "RESTORER",
    operatorId: payload.operator_id,
    operatorName: options?.operatorName
  });

/** 旧步骤按当前台账补齐批次版本。 */
export const backfillStepBatch = (stepId: number, batchId: number | null) =>
  http.post<RestorationStep>(`${endpoint}/steps/${stepId}/backfill`, { batch_id: batchId }, { role: "RESTORER" });

export interface PlanChain {
  plan_id: number;
  ledger_total: number;
  steps: RestorationStep[];
  requisitions: MaterialRequisition[];
  batches: MaterialBatch[];
}

/** 方案领用链台账（专家复算核对）。 */
export const fetchPlanChain = (planId: number) =>
  http.get<PlanChain>(`${endpoint}/plan/${planId}`);
