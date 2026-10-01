import type { RequisitionDraft, RequisitionSubmitPayload } from "../types/MaterialRequisition";

/**
 * 现场断网草稿队列。
 *  - 断网提交不丢失：草稿写入 localStorage，键含步骤 id，天然「按步骤」分组；
 *  - 同一步骤多次编辑只保留最新一条（回网按步骤合并），但 request_id 稳定，
 *    服务端幂等保证该步骤只扣一次；
 *  - 重新选择批次会生成新 request_id，避免与已被拒绝的旧选择共用幂等键。
 */
const STORAGE_KEY = "relic-restore:requisition-drafts:v1";

function readAll(): Record<string, RequisitionDraft> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, RequisitionDraft>;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, RequisitionDraft>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

const stepKey = (stepId: number) => `step:${stepId}`;

export function stableRequestId(stepId: number): string {
  return `draft-${stepId}-${new Date().toISOString().slice(0, 10)}`;
}

/** 暂存草稿：同一步骤后写覆盖先写（按步骤合并），保留首次创建时间。 */
export function saveDraft(payload: RequisitionSubmitPayload, operatorName?: string): RequisitionDraft {
  const map = readAll();
  const key = stepKey(payload.step_id);
  const now = new Date().toISOString();
  const previous = map[key];
  // 重新选择批次（batch_id 变化）时更换 request_id；仅改用量则沿用，保持幂等。
  const requestId =
    previous && previous.batch_id === payload.batch_id ? previous.request_id : payload.request_id || stableRequestId(payload.step_id);

  const draft: RequisitionDraft = {
    ...payload,
    request_id: requestId,
    draft_id: previous?.draft_id ?? `draft-${payload.step_id}-${Date.now()}`,
    operator_name: operatorName,
    created_at: previous?.created_at ?? now,
    updated_at: now,
    sync_state: "LOCAL"
  };
  map[key] = draft;
  writeAll(map);
  return draft;
}

export function listDrafts(): RequisitionDraft[] {
  return Object.values(readAll()).sort((a, b) => a.step_id - b.step_id);
}

export function countDrafts(): number {
  return Object.keys(readAll()).length;
}

export function removeDraft(stepId: number): void {
  const map = readAll();
  delete map[stepKey(stepId)];
  writeAll(map);
}

export function markDraft(stepId: number, patch: Partial<RequisitionDraft>): void {
  const map = readAll();
  const key = stepKey(stepId);
  if (map[key]) {
    map[key] = { ...map[key], ...patch };
    writeAll(map);
  }
}

export function clearSyncedDrafts(): void {
  const map = readAll();
  for (const key of Object.keys(map)) {
    if (map[key].sync_state === "SYNCED") delete map[key];
  }
  writeAll(map);
}
