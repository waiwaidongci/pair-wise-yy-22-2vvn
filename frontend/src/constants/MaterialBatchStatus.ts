export const MaterialBatchStatus = ["ACTIVE", "RECALLED", "EXPIRED", "DEPLETED"] as const;
export type MaterialBatchStatus = (typeof MaterialBatchStatus)[number];
export const MaterialBatchStatusText: Record<MaterialBatchStatus, string> = {
  ACTIVE: "正常",
  RECALLED: "已召回",
  EXPIRED: "已过期",
  DEPLETED: "已耗尽"
};
