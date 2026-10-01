import type { MaterialBatch } from "../types/MaterialBatch";

export const createDefaultMaterialBatch = (overrides: Partial<MaterialBatch> = {}): MaterialBatch => ({
  id: 1 as never,
  batch_no: "BATCH-2026-001" as never,
  material_name: "修复用棉纸" as never,
  spec: "30cm×30cm" as never,
  supplier: "供应商 A" as never,
  total_qty: 100 as never,
  remaining_qty: 60 as never,
  unit: "张" as never,
  expiry_date: "2027-01-01" as never,
  status: "ACTIVE" as never,
  received_at: "2026-01-10T09:00:00Z" as never,
  ...overrides
});

export const createMaterialBatchForm = createDefaultMaterialBatch;
export const createMaterialBatchResponse = createDefaultMaterialBatch;
