export interface ImageVersion {
  id: number;
  relic_id: number;
  plan_id: number;
  version_no: string;
  image_type: string;
  file_path: string;
  capture_at: string;
  note: string;
  /** 领用链：影像凭证关联的修复步骤 */
  step_id: number | null;
  /** 领用链：影像凭证关联的领用记录 */
  requisition_id: number | null;
}
