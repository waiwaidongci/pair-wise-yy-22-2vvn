import { ERROR_CODES, type ErrorCode } from "./errorCodes";

/** 面向修复师/专家/档案员的中文错误提示。新增错误码时同步补充这里。 */
export const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",

  STEP_NOT_FOUND: "修复步骤不存在",
  PLAN_NOT_FOUND: "修复方案不存在",
  BATCH_NOT_FOUND: "材料批次不存在",
  REQUISITION_NOT_FOUND: "领用单不存在",

  PLAN_NOT_APPROVED: "方案尚未审批通过，不能领用材料",
  PLAN_ALREADY_ARCHIVED: "方案已归档，链路已冻结",
  PLAN_AWAITING_RECHECK: "方案实际用量还未经专家复算，不能归档",
  PLAN_NOT_SUBMITTED: "方案未提交审批",
  PLAN_RECALC_MISMATCH: "复算总用量与领用台账不一致，请核对影像凭证后重算",

  STEP_ALREADY_FINISHED: "步骤已完成，原用量保留，不能再领用",
  STEP_LOCKED_BY_ARCHIVE: "步骤所属方案已归档，禁止领用",
  STEP_LOCKED_BY_PEER: "另一名修复师正在执行该步骤，请稍后重新选择批次",
  STEP_EXECUTION_CONFLICT: "步骤在服务器已被更新，后到方请重新选择批次与用量",
  STEP_IMAGE_MISMATCH: "影像凭证不属于该步骤，审批与凭证无法对应",
  STEP_IMAGE_VERSION_REQUIRED: "步骤完成/领用必须绑定影像凭证版本",

  BATCH_INVALID: "该批次已召回或过期，不能领用",
  BATCH_INSUFFICIENT: "批次余量不足，请选择替代批次",
  BATCH_QUANTITY_INVALID: "用量必须是大于 0 的数字",
  BATCH_ALREADY_ACTIVE: "批次已是合格在库状态",

  ARCHIVE_FROZEN: "方案已归档，禁止再领用材料",
  IDEMPOTENCY_REPLAY: "该请求已处理，请勿重复扣减",

  OFFLINE_DRAFT_SAVED: "现场断网：已暂存为草稿，回网后按步骤合并"
};
