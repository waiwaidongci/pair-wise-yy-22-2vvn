import type { DatabaseShape } from "../models/DatabaseShape";
import type { AuditLogEntry } from "../models/AuditLogEntry";

type CollectionKey =
  | "relicItem"
  | "damageRecord"
  | "restorationPlan"
  | "restorationStep"
  | "imageVersion"
  | "materialBatch"
  | "materialRequisition"
  | "auditLog";

/** 事务内取下一个自增 id（台账文件是唯一发号源，保证幂等重放不乱号）。 */
export function nextId(draft: DatabaseShape, key: CollectionKey): number {
  const seqKey: keyof DatabaseShape["sequences"] = key;
  draft.sequences[seqKey] = (draft.sequences[seqKey] ?? 0) + 1;
  return draft.sequences[seqKey];
}

/** 追加一条审计日志；所有写操作都要经过这里，禁止在 controller 里 console 代替。 */
export function appendAuditLog(
  draft: DatabaseShape,
  params: { actor: string; action: string; targetType: string; targetId: string | number; detail: string }
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: nextId(draft, "auditLog"),
    actor: params.actor,
    action: params.action,
    target_type: params.targetType,
    target_id: String(params.targetId),
    detail: params.detail,
    created_at: new Date().toISOString()
  };
  draft.auditLog.push(entry);
  return entry;
}
