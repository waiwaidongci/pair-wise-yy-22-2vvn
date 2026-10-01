export interface MaterialRequisition {
  id: number;
  request_no: string;
  step_id: number;
  plan_id: number;
  batch_id: number;
  qty: number;
  operator_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}
