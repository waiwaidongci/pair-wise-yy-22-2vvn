export interface RestorationStep {
  id: number;
  plan_id: number;
  step_order: string;
  technique: string;
  material_used: string;
  operator_id: number;
  step_status: string;
  finished_at: string;
  /** 领用链：批次版本（材料批次） */
  material_batch_id: number | null;
  /** 领用链：本步骤已确认用量 */
  material_qty: number;
  /** 领用链：领用状态 NONE / CONFIRMED / ROLLED_BACK */
  requisition_status: string;
  /** 台账版本，用于并发冲突检测（后到方重新选择） */
  ledger_version: number;
}
