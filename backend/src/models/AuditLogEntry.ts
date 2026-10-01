/** 操作日志条目（方案审批、影像归档、病害关闭、领用链全动作）。 */
export interface AuditLogEntry {
  id: number;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  detail: string;
  created_at: string;
}
