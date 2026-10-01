export const createMaterialRequisitionDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  request_no: "REQ-SEED-0001",
  step_id: 1,
  plan_id: 1,
  batch_id: 1,
  qty: 5,
  operator_id: 1,
  status: "CONFIRMED",
  created_at: "2026-06-11T09:05:00Z",
  updated_at: "2026-06-11T09:05:00Z",
  ...overrides
});
