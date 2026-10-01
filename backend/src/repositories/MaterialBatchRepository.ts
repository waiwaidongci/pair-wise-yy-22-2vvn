import { ledgerDatabase } from "../db/ledgerDatabase";
import type { MaterialBatch } from "../models/MaterialBatch";

export const materialBatchRepository = {
  findAll: (): MaterialBatch[] => ledgerDatabase.list<MaterialBatch>("materialBatch"),
  findById: (id: number): MaterialBatch | undefined => ledgerDatabase.findById<MaterialBatch>("materialBatch", id),
  findByStatus: (status: string): MaterialBatch[] =>
    ledgerDatabase.findAll<MaterialBatch>("materialBatch", (row) => row.status === status),
  save: (row: Partial<MaterialBatch> & { id?: number }): MaterialBatch =>
    ledgerDatabase.insert<MaterialBatch>("materialBatch", row as MaterialBatch),
  update: (id: number, patch: Partial<MaterialBatch>): MaterialBatch | undefined =>
    ledgerDatabase.update<MaterialBatch>("materialBatch", id, patch)
};
