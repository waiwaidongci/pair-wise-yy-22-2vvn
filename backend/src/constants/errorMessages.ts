export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "missing bearer token",
  RBAC_DENIED: "role denied",
  VALIDATION_FAILED: "invalid payload",
  RATE_LIMITED: "too many requests",
  // 领用链相关
  BATCH_NOT_FOUND: "材料批次不存在",
  BATCH_INACTIVE: "材料批次已失效（召回/耗尽），请重新选择批次",
  BATCH_EXPIRED: "材料批次已过期，请重新选择批次",
  BATCH_INSUFFICIENT: "材料批次余量不足，请选择替代批次",
  STEP_NOT_FOUND: "修复步骤不存在",
  STEP_COMPLETED: "步骤已完成，保留原用量，不可再领用",
  PLAN_ARCHIVED: "方案已归档，禁止再领用材料",
  PLAN_NOT_FOUND: "修复方案不存在",
  REQUISITION_CONFLICT: "步骤已被他人修改，请重新选择批次",
  REQUISITION_NOT_FOUND: "领用记录不存在",
  PLAN_NOT_RECALCULATED: "专家复算通过后才能审批方案",
  LEDGER_INCONSISTENT: "台账与批次余量不一致，请重新复算",
  IMAGE_EVIDENCE_MISSING: "领用缺少影像凭证，请上传后再复算"
};
