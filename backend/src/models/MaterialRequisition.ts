import type { RequisitionStatus } from "../constants/RequisitionStatus";

/**
 * 材料领用单：可恢复领用链的核心凭证。
 * 一行 = 一次「修复师在某步骤上对某批次、某影像版本」的用量提交。
 *
 * request_id        幂等键：现场断网重试 / 前端合并时同一请求号只会扣一次
 * reversed_from_id  冲回来源：批次失效时新开冲回单指向原单，原单保留原用量
 * locked            方案归档后置真，历史用量只读
 * 已完成步骤的已 CONSUMED 领用单永不冲回，只追加 LOCKED 标记。
 */
export interface MaterialRequisition {
  id: number;
  request_id: string;
  step_id: number;
  plan_id: number;
  batch_id: number;
  batch_version_no: number;
  image_version_id: number | null;
  operator_id: number;
  quantity: number;
  status: RequisitionStatus;
  reversed_from_id: number | null;
  locked: boolean;
  submitted_at: string;
  finalized_at: string | null;
}
