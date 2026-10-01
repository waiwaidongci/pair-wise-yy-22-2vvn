import { ledgerDatabase } from "../db/ledgerDatabase";
import type { RestorationPlan } from "../models/RestorationPlan";

export const restorationPlanRepository = {
  findAll: (): RestorationPlan[] => ledgerDatabase.list<RestorationPlan>("restorationPlan"),
  findById: (id: number): RestorationPlan | undefined => ledgerDatabase.findById<RestorationPlan>("restorationPlan", id),
  save: (row: Partial<RestorationPlan> & { id?: number }): RestorationPlan =>
    ledgerDatabase.insert<RestorationPlan>("restorationPlan", row as RestorationPlan),
  update: (id: number, patch: Partial<RestorationPlan>): RestorationPlan | undefined =>
    ledgerDatabase.update<RestorationPlan>("restorationPlan", id, patch)
};
