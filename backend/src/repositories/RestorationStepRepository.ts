import { ledgerDatabase } from "../db/ledgerDatabase";
import type { RestorationStep } from "../models/RestorationStep";

export const restorationStepRepository = {
  findAll: (): RestorationStep[] => ledgerDatabase.list<RestorationStep>("restorationStep"),
  findById: (id: number): RestorationStep | undefined => ledgerDatabase.findById<RestorationStep>("restorationStep", id),
  findByPlan: (planId: number): RestorationStep[] =>
    ledgerDatabase.findAll<RestorationStep>("restorationStep", (row) => Number(row.plan_id) === planId),
  save: (row: Partial<RestorationStep> & { id?: number }): RestorationStep =>
    ledgerDatabase.insert<RestorationStep>("restorationStep", row as RestorationStep),
  update: (id: number, patch: Partial<RestorationStep>): RestorationStep | undefined =>
    ledgerDatabase.update<RestorationStep>("restorationStep", id, patch)
};
