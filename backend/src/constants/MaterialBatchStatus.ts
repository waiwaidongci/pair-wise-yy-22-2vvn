export const MaterialBatchStatus = ["ACTIVE", "RECALLED", "EXPIRED", "DEPLETED"] as const;
export type MaterialBatchStatus = (typeof MaterialBatchStatus)[number];
