import { ERROR_CODES } from "./errorCodes";

/**
 * 错误消息模板集中登记。{xxx} 占位由 BusinessError.withDetails 填充。
 */
export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  AUTH_REQUIRED: "missing bearer token",
  RBAC_DENIED: "role denied: required {roles}",
  VALIDATION_FAILED: "invalid payload: {reason}",
  RATE_LIMITED: "too many requests",

  STEP_NOT_FOUND: "restoration step {stepId} not found",
  PLAN_NOT_FOUND: "restoration plan {planId} not found",
  BATCH_NOT_FOUND: "material batch {batchId} not found",
  REQUISITION_NOT_FOUND: "material requisition {requisitionId} not found",

  PLAN_NOT_APPROVED: "plan {planId} is not approved, material requisition is not allowed",
  PLAN_ALREADY_ARCHIVED: "plan {planId} has been archived and is frozen",
  PLAN_AWAITING_RECHECK: "plan {planId} actual usage awaits expert recalculation",
  PLAN_NOT_SUBMITTED: "plan {planId} is not submitted for approval",
  PLAN_RECALC_MISMATCH: "expert recalculated total {recalcTotal} does not match ledger total {ledgerTotal}",

  STEP_ALREADY_FINISHED: "step {stepId} is finished and keeps its original usage",
  STEP_LOCKED_BY_ARCHIVE: "step {stepId} belongs to archived plan {planId}",
  STEP_LOCKED_BY_PEER: "step {stepId} is being executed by {operatorId}, please re-select later",
  STEP_EXECUTION_CONFLICT: "step {stepId} changed on server (baseVersion {baseVersion}); late submitter must re-select batch",
  STEP_IMAGE_MISMATCH: "image version {imageVersionId} is not evidence of step {stepId}",
  STEP_IMAGE_VERSION_REQUIRED: "step {stepId} finish requires an image evidence version",

  BATCH_INVALID: "batch {batchId} is {batchStatus} and cannot be consumed",
  BATCH_INSUFFICIENT: "batch {batchId} remaining {remaining} is less than requested {requested}",
  BATCH_QUANTITY_INVALID: "quantity must be a positive number, got {quantity}",
  BATCH_ALREADY_ACTIVE: "batch {batchId} is already active",

  ARCHIVE_FROZEN: "plan {planId} archived: no more material requisition is accepted",
  IDEMPOTENCY_REPLAY: "request {requestId} has already been processed"
};
