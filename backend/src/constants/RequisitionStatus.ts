export const RequisitionStatus = ["CONFIRMED", "ROLLED_BACK"] as const;
export type RequisitionStatus = (typeof RequisitionStatus)[number];
