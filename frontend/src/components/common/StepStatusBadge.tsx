import { StepExecutionStatusText, type StepExecutionStatus } from "../../constants/StepExecutionStatus";

const CLASS: Record<string, string> = {
  PENDING: "step-pending",
  REWORK_PENDING: "step-rework",
  FINISHED: "step-finished"
};

/** 步骤执行态徽标：待重算用醒目橙色提示修复师重新选批次。 */
export function StepStatusBadge({ value }: { value: StepExecutionStatus | string }) {
  return <span className={`badge ${CLASS[value] ?? ""}`}>{StepExecutionStatusText[value as StepExecutionStatus] ?? value}</span>;
}
