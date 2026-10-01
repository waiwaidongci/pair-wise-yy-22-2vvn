import { RequisitionStatusText } from "../../constants/RequisitionStatus";

const CLASS_MAP: Record<string, string> = {
  CONFIRMED: "req-confirmed",
  ROLLED_BACK: "req-rolled-back"
};

export function RequisitionStatusBadge({ status }: { status: string }) {
  const text = RequisitionStatusText[status as keyof typeof RequisitionStatusText] ?? status;
  return <span className={"badge " + (CLASS_MAP[status] ?? "req-confirmed")}>{text}</span>;
}
