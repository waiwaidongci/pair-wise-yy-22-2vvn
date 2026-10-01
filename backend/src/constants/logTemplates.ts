export const LOG_TEMPLATES = {
  RelicItem: ["RelicItem.create", "RelicItem.update", "RelicItem.status", "RelicItem.export"],
  DamageRecord: ["DamageRecord.create", "DamageRecord.update", "DamageRecord.status", "DamageRecord.export"],
  RestorationPlan: [
    "RestorationPlan.create",
    "RestorationPlan.update",
    "RestorationPlan.status",
    "RestorationPlan.export",
    "RestorationPlan.recalc",
    "RestorationPlan.approve",
    "RestorationPlan.archive"
  ],
  RestorationStep: [
    "RestorationStep.create",
    "RestorationStep.update",
    "RestorationStep.status",
    "RestorationStep.export",
    "RestorationStep.requisition",
    "RestorationStep.requisitionConflict",
    "RestorationStep.rollback",
    "RestorationStep.backfill"
  ],
  ImageVersion: [
    "ImageVersion.create",
    "ImageVersion.update",
    "ImageVersion.status",
    "ImageVersion.export",
    "ImageVersion.evidence"
  ],
  MaterialBatch: [
    "MaterialBatch.create",
    "MaterialBatch.update",
    "MaterialBatch.status",
    "MaterialBatch.export",
    "MaterialBatch.recall",
    "MaterialBatch.suggestAlternatives"
  ],
  MaterialRequisition: [
    "MaterialRequisition.create",
    "MaterialRequisition.update",
    "MaterialRequisition.rollback",
    "MaterialRequisition.idempotentHit"
  ]
};
