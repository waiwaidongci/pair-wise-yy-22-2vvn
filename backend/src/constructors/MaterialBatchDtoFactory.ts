export const createMaterialBatchDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  batch_no: "BATCH-2026-001",
  material_name: "修复用棉纸",
  spec: "30cm×30cm",
  supplier: "供应商 A",
  total_qty: 100,
  remaining_qty: 60,
  unit: "张",
  expiry_date: "2027-01-01",
  status: "ACTIVE",
  received_at: "2026-01-10T09:00:00Z",
  ...overrides
});
