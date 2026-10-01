/**
 * 材料领用单状态。
 * CONSUMED 正常扣减、材料已用于未完成/已完成步骤
 * REVERSED 批次失效触发冲回：剩余量已退回台账，步骤随之退回重算
 * LOCKED   方案归档后历史用量锁定（已完成步骤不冲回，仅做只读标记）
 */
export const RequisitionStatus = [
  "CONSUMED",
  "REVERSED",
  "LOCKED"
] as const;
export type RequisitionStatus = (typeof RequisitionStatus)[number];
