export const PlanRecalcStatus = ["PENDING", "RECALCULATED"] as const;
export type PlanRecalcStatus = (typeof PlanRecalcStatus)[number];
