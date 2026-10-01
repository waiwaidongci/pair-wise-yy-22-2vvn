export interface RestorationPlan {
  id: number;
  relic_id: number;
  damage_record_id: number;
  plan_title: string;
  method: string;
  risk_assessment: string;
  approval_status: string;
  owner_id: number;

  material_rechecked: boolean;
  recalculated_total: number | null;
  ledger_total: number | null;
  archived_at: string | null;
  archived_by: number | null;
}
