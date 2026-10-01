/**
 * 操作日志模板集中登记。所有写操作（领用、退回、复算、归档、批次处置）
 * 都必须选择对应模板，字段变更时同步修改模板与调用处。
 */
export const LOG_TEMPLATES = {
  RelicItem: ["RelicItem.create", "RelicItem.update", "RelicItem.status", "RelicItem.export"],
  DamageRecord: ["DamageRecord.create", "DamageRecord.update", "DamageRecord.status", "DamageRecord.close"],
  RestorationPlan: [
    "RestorationPlan.create",
    "RestorationPlan.submit",
    "RestorationPlan.recalculate",
    "RestorationPlan.approve",
    "RestorationPlan.reject",
    "RestorationPlan.archive"
  ],
  RestorationStep: [
    "RestorationStep.create",
    "RestorationStep.requisition.consume",
    "RestorationStep.requisition.replay",
    "RestorationStep.requisition.rework",
    "RestorationStep.finish",
    "RestorationStep.draft.merge"
  ],
  ImageVersion: ["ImageVersion.create", "ImageVersion.update", "ImageVersion.bindStep", "ImageVersion.archive"],
  MaterialBatch: [
    "MaterialBatch.create",
    "MaterialBatch.replenish",
    "MaterialBatch.recall",
    "MaterialBatch.expire",
    "MaterialBatch.ledger.backfill"
  ]
} as const;
