export const toAuditTarget = (type: string, id: string | number) => `${type}#${id}`;

export const formatQty = (qty: number, unit: string): string => `${qty} ${unit}`;

export const formatBatchStatus = (status: string): string =>
  ({ ACTIVE: "正常", RECALLED: "已召回", EXPIRED: "已过期", DEPLETED: "已耗尽" }[status] ?? status);

export const formatRequisitionStatus = (status: string): string =>
  ({ CONFIRMED: "已确认", ROLLED_BACK: "已退回" }[status] ?? status);

export const formatRecalcStatus = (status: string): string =>
  ({ PENDING: "待复算", RECALCULATED: "已复算" }[status] ?? status);

export const isExpired = (expiryDate: string): boolean => {
  if (!expiryDate) return false;
  const time = new Date(expiryDate).getTime();
  return Number.isFinite(time) && time < Date.now();
};
