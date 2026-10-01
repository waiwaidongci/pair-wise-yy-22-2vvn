import { MaterialBatchStatusText, type MaterialBatchStatus } from "../../constants/MaterialBatchStatus";

const CLASS: Record<string, string> = {
  ACTIVE: "batch-active",
  RECALLED: "batch-recalled",
  EXPIRED: "batch-expired",
  DEPLETED: "batch-depleted"
};

/** 批次台账状态徽标：被详情、列表、领用表单、替代批次提示共用。 */
export function BatchStatusBadge({ value }: { value: MaterialBatchStatus | string }) {
  return <span className={`badge ${CLASS[value] ?? ""}`}>{MaterialBatchStatusText[value as MaterialBatchStatus] ?? value}</span>;
}
