import type { StepExecutionStatus } from "../constants/StepExecutionStatus";

/**
 * 修复步骤。
 * execution_status    执行态：待执行 / 待重算 / 已完成
 * batch_id            当前选定批次；为 null 表示旧步骤尚未补齐批次版本
 * batch_version_no    提交时台账版本，用于失效追溯与后到方冲突检测
 * quantity_used       当前生效用量（历史原用量在已完成/归档后冻结）
 * image_version_id    影像凭证版本，提交用量时绑定，专家复算据此核对
 * lock_holder_id      两名修复师并发时的执行锁持有者
 * base_version        乐观版本：后到方 base 过期必须重新选择批次
 * rework_reason       批次失效退回原因（召回/过期）
 */
export interface RestorationStep {
  id: number;
  plan_id: number;
  step_order: string;
  technique: string;
  material_used: string;
  operator_id: number | null;
  step_status: string;
  finished_at: string | null;

  execution_status: StepExecutionStatus;
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
