export const StepExecutionStatus = ["PENDING", "REWORK_PENDING", "FINISHED"] as const;
export type StepExecutionStatus = (typeof StepExecutionStatus)[number];
export const StepExecutionStatusText: Record<StepExecutionStatus, string> = {
  PENDING: "待执行",
  REWORK_PENDING: "待重算",
  FINISHED: "已完成"
};
