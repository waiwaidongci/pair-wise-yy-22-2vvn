/**
 * 材料批次台账实体。
 * 单位统一为克/毫升等数值用量，remaining_quantity 是唯一权威余量，
 * 只允许在领用事务内通过扣减/冲回维护。
 */
export interface MaterialBatch {
  id: number;
  batch_no: string;
  material_name: string;
  spec: string;
  total_quantity: number;
  remaining_quantity: number;
  status: string; // MaterialBatchStatus
  produced_at: string;
  expires_at: string;
  recalled_at: string | null;
  created_at: string;
  updated_at: string;
}
