import { useCallback, useEffect, useState } from "react";
import { submitStepRequisition } from "../api/RestorationStep";
import type { SubmitRequisitionPayload } from "../api/MaterialRequisition";

/**
 * 现场断网先存草稿，回网按步骤合并。
 * 草稿按步骤 id 归一，同一步骤只保留最新一份。
 */

export interface OfflineDraft {
  step_id: number;
  batch_id: number;
  qty: number;
  request_no: string;
  operator_id?: number;
  base_ledger_version?: number;
  updated_at: string;
}

const STORAGE_KEY = "relic-restore:offline-drafts";

const readDrafts = (): Record<number, OfflineDraft> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<number, OfflineDraft>) : {};
  } catch {
    return {};
  }
};

const writeDrafts = (drafts: Record<number, OfflineDraft>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // 存储不可用时静默失败，草稿仍保留在内存中。
  }
};

export interface MergeResult {
  merged: number;
  conflicts: Array<{ step_id: number; message: string }>;
}

export function useOfflineDraft() {
  const [drafts, setDrafts] = useState<Record<number, OfflineDraft>>({});
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    setDrafts(readDrafts());
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const saveDraft = useCallback((draft: SubmitRequisitionPayload) => {
    const stored = readDrafts();
    stored[draft.step_id] = { ...draft, updated_at: new Date().toISOString() };
    writeDrafts(stored);
    setDrafts({ ...stored });
  }, []);

  const removeDraft = useCallback((stepId: number) => {
    const stored = readDrafts();
    delete stored[stepId];
    writeDrafts(stored);
    setDrafts({ ...stored });
  }, []);

  /** 回网后按步骤合并：逐份提交，冲突的步骤保留草稿并提示重新选择。 */
  const mergeDrafts = useCallback(async (): Promise<MergeResult> => {
    setMerging(true);
    const current = readDrafts();
    const conflicts: MergeResult["conflicts"] = [];
    let merged = 0;
    for (const [stepIdRaw, draft] of Object.entries(current)) {
      const stepId = Number(stepIdRaw);
      try {
        await submitStepRequisition({
          step_id: draft.step_id,
          batch_id: draft.batch_id,
          qty: draft.qty,
          request_no: draft.request_no,
          operator_id: draft.operator_id,
          base_ledger_version: draft.base_ledger_version
        });
        delete current[stepId];
        merged += 1;
      } catch (error) {
        const code = (error as { code?: string }).code;
        conflicts.push({
          step_id: stepId,
          message:
            code === "REQUISITION_CONFLICT"
              ? "步骤已被他人修改，请重新选择批次"
              : (error as Error).message || "合并失败，请重试"
        });
      }
    }
    writeDrafts(current);
    setDrafts({ ...current });
    setMerging(false);
    return { merged, conflicts };
  }, []);

  return {
    drafts,
    online,
    merging,
    saveDraft,
    removeDraft,
    mergeDrafts,
    draftCount: Object.keys(drafts).length
  };
}
