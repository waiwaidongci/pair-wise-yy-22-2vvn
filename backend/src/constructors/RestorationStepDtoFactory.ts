export const createRestorationStepDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  plan_id: 1,
  step_order: "step order 1",
  technique: "technique 1",
  material_used: "material used 1",
  operator_id: 1,
  step_status: "SUBMITTED",
  finished_at: "2026-06-11T09:00:00Z",
  material_batch_id: 1,
  material_qty: 5,
  requisition_status: "CONFIRMED",
  ledger_version: 1,
  ...overrides
});
