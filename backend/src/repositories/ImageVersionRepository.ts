import { ledgerDatabase } from "../db/ledgerDatabase";
import type { ImageVersion } from "../models/ImageVersion";

export const imageVersionRepository = {
  findAll: (): ImageVersion[] => ledgerDatabase.list<ImageVersion>("imageVersion"),
  findById: (id: number): ImageVersion | undefined => ledgerDatabase.findById<ImageVersion>("imageVersion", id),
  findByPlan: (planId: number): ImageVersion[] =>
    ledgerDatabase.findAll<ImageVersion>("imageVersion", (row) => Number(row.plan_id) === planId),
  findByRequisition: (requisitionId: number): ImageVersion[] =>
    ledgerDatabase.findAll<ImageVersion>("imageVersion", (row) => Number(row.requisition_id) === requisitionId),
  save: (row: Partial<ImageVersion> & { id?: number }): ImageVersion =>
    ledgerDatabase.insert<ImageVersion>("imageVersion", row as ImageVersion),
  update: (id: number, patch: Partial<ImageVersion>): ImageVersion | undefined =>
    ledgerDatabase.update<ImageVersion>("imageVersion", id, patch)
};
