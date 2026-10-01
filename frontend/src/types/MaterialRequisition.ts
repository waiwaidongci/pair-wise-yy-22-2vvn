import type { RequisitionStatus } from "../constants/RequisitionStatus";
import type { MaterialBatch } from "./MaterialBatch";
import type { RestorationStep } from "./RestorationStep";

/** 材料领用单（可恢复领用链凭证）。 */
export interface MaterialRequisition {
  id: number;
  request_id: string;
  step_id: number;
  plan_id: number;
  batch_id: number;
  batch_version_no: number;
  image_version_id: number | null;
  operator_id: number;
  quantity: number;
  status: RequisitionStatus | string;
  reversed_from_id: number | null;
  locked: boolean;
  submitted_at: string;
  finalized_at: string | null;
}

/** 修复师提交批次用量的载荷；request_id 是断网重传/按步骤合并的幂等键。 */
export interface RequisitionSubmitPayload {
  request_id: string;
  step_id: number;
  batch_id: number;
  quantity: number;
  image_version_id?: number | null;
  operator_id?: number;
  base_version: number;
  draft_only?: boolean;
}

/** 服务端提交结果：携带替代批次与退回重算信息。 */
export interface RequisitionResult {
  idempotent: boolean;
  requisition: MaterialRequisition;
  step: import("./RestorationStep").RestorationStep;
  batch: Pick<MaterialBatch, "id" | "batch_no" | "material_name" | "remaining_quantity" | "status">;
  alternatives: MaterialBatch[];
  rework: { triggered: boolean; reason: string | null; affected_step_ids: number[] };
}

/** 本地离线草稿：断网时只存 localStorage，回网后按步骤合并提交。 */
export interface RequisitionDraft extends RequisitionSubmitPayload {
  draft_id: string;
  operator_name?: string;
  created_at: string;
  updated_at: string;
  sync_state: "LOCAL" | "SYNCING" | "SYNCED" | "CONFLICT";
  conflict_code?: string;
  conflict_message?: string;
}
