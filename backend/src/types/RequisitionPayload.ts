/**
 * 修复师在步骤上提交批次与用量的请求载荷。
 * request_id    现场断网重传/前端按步骤合并时生成的幂等键
 * base_version  修复师上次看到的步骤版本，用于后到方冲突检测
 * image_version_id 影像凭证版本，必须属于同一步骤
 * draft_only    true 表示仅暂存草稿（由前端离线队列使用，服务端不落扣减）
 */
export interface RequisitionSubmitPayload {
  request_id: string;
  step_id: number;
  batch_id: number;
  quantity: number;
  image_version_id?: number | null;
  operator_id?: number;
  operator_name?: string;
  base_version: number;
  draft_only?: boolean;
}

export type RequisitionSubmitInput = RequisitionSubmitPayload | Record<string, unknown>;
