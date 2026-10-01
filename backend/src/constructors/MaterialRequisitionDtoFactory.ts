import type { RequisitionResult } from "./RequisitionResultFactory";

/**
 * 领用提交对外响应 DTO 构造器：
 * 与 RequisitionResult 同源，但隐藏内部 batchMap/负向冲回明细的冗余字段，
 * 只暴露修复师重选批次所需的 alternatives 与退回信息。
 */
export const createRequisitionDtoFromResult = (result: RequisitionResult) => ({
  idempotent: result.idempotent,
  requisition: result.requisition,
  step: result.step,
  batch: result.batch,
  alternatives: result.alternatives,
  rework: result.rework
});
