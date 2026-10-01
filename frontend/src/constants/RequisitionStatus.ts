export const RequisitionStatus = ["CONSUMED", "REVERSED", "LOCKED"] as const;
export type RequisitionStatus = (typeof RequisitionStatus)[number];
export const RequisitionStatusText: Record<RequisitionStatus, string> = {
  CONSUMED: "已扣减",
  REVERSED: "已冲回",
  LOCKED: "归档锁定"
};
