/**
 * 材料批次台账状态。
 * ACTIVE   合格在库，可被领用
 * RECALLED 被召回，禁止领用，已领用的未完成步骤须退回重算
 * EXPIRED  已过期，禁止领用，已领用的未完成步骤须退回重算
 * DEPLETED 余量耗尽（由扣减维护，也可人工标记）
 */
export const MaterialBatchStatus = [
  "ACTIVE",
  "RECALLED",
  "EXPIRED",
  "DEPLETED"
] as const;
export type MaterialBatchStatus = (typeof MaterialBatchStatus)[number];
