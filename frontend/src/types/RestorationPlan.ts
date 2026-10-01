export interface RestorationPlan {
  id: number;
  relic_id: number;
  damage_record_id: number;
  plan_title: string;
  method: string;
  risk_assessment: string;
  approval_status: string;
  owner_id: number;
  /** 领用链：台账版本 */
  ledger_version: number;
  /** 领用链：专家复算状态 PENDING / RECALCULATED */
  recalc_status: string;
  /** 归档时间，归档后禁止领用 */
  archived_at: string | null;
}
