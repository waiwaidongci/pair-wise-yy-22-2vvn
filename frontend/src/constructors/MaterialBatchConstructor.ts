import type { MaterialBatch } from "../types/MaterialBatch";

export const createDefaultMaterialBatch = (overrides: Partial<MaterialBatch> = {}): MaterialBatch => ({
  id: 0,
  batch_no: "",
  material_name: "",
  spec: "",
  total_quantity: 0,
  remaining_quantity: 0,
  status: "ACTIVE",
  produced_at: "",
  expires_at: "",
  recalled_at: null,
  created_at: "",
  updated_at: "",
  ...overrides
});

export const createMaterialBatchForm = createDefaultMaterialBatch;
export const createMaterialBatchResponse = createDefaultMaterialBatch;
