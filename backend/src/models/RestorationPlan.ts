import type { PlanApprovalStatus } from "../constants/PlanApprovalStatus";

/**
 * 修复方案。
 * approval_status         审批态：DRAFT/SUBMITTED/APPROVED/REJECTED/ARCHIVED
 * material_rechecked     专家是否已按实际领用台账复算用量
 * recalculated_total     专家复算后的材料总用量
 * ledger_total           截至复算时台账实际用量快照（由服务端写入，专家只确认）
 * archived_at / archived_by 归档信息，归档后禁止再领用
 */
export interface RestorationPlan {
  id: number;
  relic_id: number;
  damage_record_id: number;
  plan_title: string;
  method: string;
  risk_assessment: string;
  approval_status: PlanApprovalStatus | string;
  owner_id: number;

  material_rechecked: boolean;
  recalculated_total: number | null;
  ledger_total: number | null;
  archived_at: string | null;
  archived_by: number | null;
}
