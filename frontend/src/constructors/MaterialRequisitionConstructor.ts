import type { MaterialRequisition } from "../types/MaterialRequisition";

export const createDefaultMaterialRequisition = (overrides: Partial<MaterialRequisition> = {}): MaterialRequisition => ({
  id: 1 as never,
  request_no: "REQ-SEED-0001" as never,
  step_id: 1 as never,
  plan_id: 1 as never,
  batch_id: 1 as never,
  qty: 5 as never,
  operator_id: 1 as never,
  status: "CONFIRMED" as never,
  created_at: "2026-06-11T09:05:00Z" as never,
  updated_at: "2026-06-11T09:05:00Z" as never,
  ...overrides
});

export const createMaterialRequisitionForm = createDefaultMaterialRequisition;
export const createMaterialRequisitionResponse = createDefaultMaterialRequisition;
