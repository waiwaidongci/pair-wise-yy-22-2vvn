export const createImageVersionDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  relic_id: 1,
  plan_id: 1,
  version_no: "version no 1",
  image_type: "FRAGILE",
  file_path: "file path 1",
  capture_at: "2026-06-11T09:00:00Z",
  note: "note 1",
  step_id: 1,
  requisition_id: 1,
  ...overrides
});
