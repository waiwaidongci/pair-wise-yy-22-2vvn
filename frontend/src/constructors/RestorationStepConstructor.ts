import type { RestorationStep } from "../types/RestorationStep";

export const createDefaultRestorationStep = (overrides: Partial<RestorationStep> = {}): RestorationStep => ({
  id: 0,
  plan_id: 0,
  step_order: "1",
  technique: "",
  material_used: "",
  operator_id: null,
  step_status: "PENDING",
  finished_at: null,
  execution_status: "PENDING",
  batch_id: null,
  batch_version_no: null,
  quantity_used: 0,
  image_version_id: null,
  lock_holder_id: null,
  lock_holder_name: null,
  base_version: 0,
  rework_reason: null,
  updated_at: "",
  ...overrides
});

export const createRestorationStepForm = createDefaultRestorationStep;
export const createRestorationStepResponse = createDefaultRestorationStep;
