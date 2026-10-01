/**
 * 修复步骤执行状态（区别于方案审批状态）。
 * PENDING                待执行：尚未提交任何批次用量
 * REWORK_PENDING         待重算：领用批次失效，步骤被退回，等待修复师重新选批次
 * FINISHED               已完成：已产出合格影像凭证并质检完成，用量被锁定
 */
export const StepExecutionStatus = [
  "PENDING",
  "REWORK_PENDING",
  "FINISHED"
] as const;
export type StepExecutionStatus = (typeof StepExecutionStatus)[number];
