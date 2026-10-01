import type { RestorationPlan } from "../types/RestorationPlan";

export const createDefaultRestorationPlan = (overrides: Partial<RestorationPlan> = {}): RestorationPlan => ({
  id: 0,
  relic_id: 0,
  damage_record_id: 0,
  plan_title: "",
  method: "",
  risk_assessment: "",
  approval_status: "DRAFT",
  owner_id: 0,
  material_rechecked: false,
  recalculated_total: null,
  ledger_total: null,
  archived_at: null,
  archived_by: null,
  ...overrides
});

export const createRestorationPlanForm = createDefaultRestorationPlan;
export const createRestorationPlanResponse = createDefaultRestorationPlan;
