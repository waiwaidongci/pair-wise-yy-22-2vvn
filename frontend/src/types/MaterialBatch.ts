/** 材料批次台账。 */
export interface MaterialBatch {
  id: number;
  batch_no: string;
  material_name: string;
  spec: string;
  total_quantity: number;
  remaining_quantity: number;
  status: "ACTIVE" | "RECALLED" | "EXPIRED" | "DEPLETED" | string;
  produced_at: string;
  expires_at: string;
  recalled_at: string | null;
  created_at: string;
  updated_at: string;
}
