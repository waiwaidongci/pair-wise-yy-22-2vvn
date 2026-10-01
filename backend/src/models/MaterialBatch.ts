export interface MaterialBatch {
  id: number;
  batch_no: string;
  material_name: string;
  spec: string;
  supplier: string;
  total_qty: number;
  remaining_qty: number;
  unit: string;
  expiry_date: string;
  status: string;
  received_at: string;
}
