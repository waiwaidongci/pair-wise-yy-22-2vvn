/** 修复步骤执行态：待执行 / 待重算（批次失效退回）/ 已完成（用量锁定）。 */
export interface RestorationStep {
  id: number;
  plan_id: number;
  step_order: string;
  technique: string;
  material_used: string;
  operator_id: number | null;
  step_status: string;
  finished_at: string | null;

  execution_status: "PENDING" | "REWORK_PENDING" | "FINISHED" | string;
  batch_id: number | null;
  batch_version_no: number | null;
  quantity_used: number;
  image_version_id: number | null;
  lock_holder_id: number | null;
  lock_holder_name: string | null;
  base_version: number;
  rework_reason: string | null;
  updated_at: string;
}
