/**
 * 影像版本。step_id 非空时表示该版本是某步骤的影像凭证，
 * 材料领用必须引用同一步骤的凭证版本，杜绝「专家审批和影像凭证对不上」。
 */
export interface ImageVersion {
  id: number;
  relic_id: number;
  plan_id: number;
  step_id: number | null;
  version_no: string;
  image_type: string;
  file_path: string;
  capture_at: string;
  note: string;
  archived: boolean;
}
