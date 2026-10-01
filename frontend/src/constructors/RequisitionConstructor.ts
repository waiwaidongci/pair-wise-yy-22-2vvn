import type { RequisitionDraft, RequisitionSubmitPayload } from "../types/MaterialRequisition";
import { stableRequestId } from "../utils/offlineDraftQueue";

/** 构造一次「在步骤上提交批次用量」的请求载荷。 */
export const createRequisitionPayload = (
  params: {
    stepId: number;
    batchId: number;
    quantity: number;
    baseVersion: number;
    imageVersionId?: number | null;
    operatorId?: number;
  },
  overrides: Partial<RequisitionSubmitPayload> = {}
): RequisitionSubmitPayload => ({
  request_id: overrides.request_id ?? stableRequestId(params.stepId),
  step_id: params.stepId,
  batch_id: params.batchId,
  quantity: params.quantity,
  image_version_id: params.imageVersionId ?? null,
  operator_id: params.operatorId ?? 1,
  base_version: params.baseVersion,
  draft_only: false,
  ...overrides
});

/** 由草稿还原出提交载荷（回网合并时使用）。 */
export const createPayloadFromDraft = (draft: RequisitionDraft): RequisitionSubmitPayload => {
  const { draft_id: _draftId, created_at: _c, updated_at: _u, sync_state: _s, operator_name: _n, conflict_code: _cc, conflict_message: _cm, ...payload } = draft;
  return { ...payload, draft_only: false };
};
