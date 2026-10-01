import { MaterialBatchStatusText } from "../../constants/MaterialBatchStatus";

const CLASS_MAP: Record<string, string> = {
  ACTIVE: "batch-active",
  RECALLED: "batch-recalled",
  EXPIRED: "batch-expired",
  DEPLETED: "batch-depleted"
};

export function MaterialBatchBadge({ status }: { status: string }) {
  const text = MaterialBatchStatusText[status as keyof typeof MaterialBatchStatusText] ?? status;
  return <span className={"badge " + (CLASS_MAP[status] ?? "batch-active")}>{text}</span>;
}
