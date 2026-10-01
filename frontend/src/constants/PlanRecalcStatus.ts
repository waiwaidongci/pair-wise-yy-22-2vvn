export const PlanRecalcStatus = ["PENDING", "RECALCULATED"] as const;
export type PlanRecalcStatus = (typeof PlanRecalcStatus)[number];
export const PlanRecalcStatusText: Record<PlanRecalcStatus, string> = {
  PENDING: "待复算",
  RECALCULATED: "已复算"
};
