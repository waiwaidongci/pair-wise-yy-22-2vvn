import { ledgerDatabase } from "../db/ledgerDatabase";
import type { MaterialRequisition } from "../models/MaterialRequisition";

export const materialRequisitionRepository = {
  findAll: (): MaterialRequisition[] => ledgerDatabase.list<MaterialRequisition>("materialRequisition"),
  findById: (id: number): MaterialRequisition | undefined =>
    ledgerDatabase.findById<MaterialRequisition>("materialRequisition", id),
  findByRequestNo: (requestNo: string): MaterialRequisition | undefined =>
    ledgerDatabase.findOne<MaterialRequisition>("materialRequisition", (row) => row.request_no === requestNo),
  findByStep: (stepId: number): MaterialRequisition[] =>
    ledgerDatabase.findAll<MaterialRequisition>("materialRequisition", (row) => Number(row.step_id) === stepId),
  findByBatch: (batchId: number): MaterialRequisition[] =>
    ledgerDatabase.findAll<MaterialRequisition>("materialRequisition", (row) => Number(row.batch_id) === batchId),
  findConfirmedByBatch: (batchId: number): MaterialRequisition[] =>
    ledgerDatabase.findAll<MaterialRequisition>(
      "materialRequisition",
      (row) => Number(row.batch_id) === batchId && row.status === "CONFIRMED"
    ),
  save: (row: Partial<MaterialRequisition> & { id?: number }): MaterialRequisition =>
    ledgerDatabase.insert<MaterialRequisition>("materialRequisition", row as MaterialRequisition),
  update: (id: number, patch: Partial<MaterialRequisition>): MaterialRequisition | undefined =>
    ledgerDatabase.update<MaterialRequisition>("materialRequisition", id, patch)
};
