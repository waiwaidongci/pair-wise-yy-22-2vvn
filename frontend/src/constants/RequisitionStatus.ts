export const RequisitionStatus = ["CONFIRMED", "ROLLED_BACK"] as const;
export type RequisitionStatus = (typeof RequisitionStatus)[number];
export const RequisitionStatusText: Record<RequisitionStatus, string> = {
  CONFIRMED: "已确认",
  ROLLED_BACK: "已退回"
};
