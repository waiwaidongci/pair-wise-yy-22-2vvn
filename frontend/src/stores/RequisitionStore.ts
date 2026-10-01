import { create } from "zustand";
import { submitRequisition, backfillStepBatch, fetchPlanChain, type PlanChain } from "../api/MaterialRequisition";
import { isOnline, type ApiError } from "../api/http";
import type { RequisitionDraft, RequisitionResult, RequisitionSubmitPayload } from "../types/MaterialRequisition";
import {
  saveDraft,
  listDrafts,
  removeDraft,
  markDraft,
  clearSyncedDrafts,
  countDrafts
} from "../utils/offlineDraftQueue";

/**
 * 领用链 store：在线直接提交（服务端幂等），断网落本地草稿，
 * 回网后按步骤逐条合并同步；并发/批次冲突的草稿标记 CONFLICT，
 * 交回修复师重新选择批次，而不是静默覆盖。
 */
type RequisitionState = {
  drafts: RequisitionDraft[];
  online: boolean;
  notice: string | null;
  lastResult: RequisitionResult | null;
  chains: Record<number, PlanChain>;
  refreshDrafts: () => void;
  setOnline: (online: boolean) => void;
  /** 修复师在步骤上提交批次用量：在线提交，断网存草稿。 */
  submit: (payload: RequisitionSubmitPayload, operatorName?: string) => Promise<{ ok: boolean; offline?: boolean; error?: ApiError; result?: RequisitionResult }>;
  /** 回网同步：按步骤合并草稿；冲突草稿保留并提示重新选择。 */
  syncDrafts: () => Promise<{ synced: number; conflicted: number }>;
  backfill: (stepId: number, batchId: number | null) => Promise<void>;
  loadChain: (planId: number) => Promise<PlanChain>;
  clearNotice: () => void;
};

export const useRequisitionStore = create<RequisitionState>((set, get) => ({
  drafts: listDrafts(),
  online: isOnline(),
  notice: null,
  lastResult: null,
  chains: {},

  refreshDrafts: () => set({ drafts: listDrafts() }),
  setOnline: (online) => set({ online }),
  clearNotice: () => set({ notice: null }),

  async submit(payload, operatorName) {
    // 断网（或显式离线）：只暂存草稿，绝不假装扣减成功。
    if (!get().online || !isOnline()) {
      const draft = saveDraft(payload, operatorName);
      set({ drafts: listDrafts(), notice: `现场断网：步骤 ${payload.step_id} 用量已暂存草稿（${countDrafts()} 条待同步）` });
      return { ok: false, offline: true };
    }

    try {
      const result = await submitRequisition(payload, { operatorName });
      set({
        lastResult: result,
        notice: result.idempotent
          ? `请求 ${payload.request_id} 已处理（幂等回放），未重复扣减`
          : `领用成功：批次 ${result.batch.batch_no} 余量 ${result.batch.remaining_quantity}`
      });
      // 若该步骤曾存过草稿，同步成功后清理。
      removeDraft(payload.step_id);
      set({ drafts: listDrafts() });
      return { ok: true, result };
    } catch (error) {
      const apiError = error as ApiError;
      // 后到方冲突 / 批次失效 / 余量不足：本地若有草稿则标记冲突，等待重新选择。
      const conflictCodes = ["STEP_EXECUTION_CONFLICT", "STEP_LOCKED_BY_PEER", "BATCH_INVALID", "BATCH_INSUFFICIENT", "STEP_IMAGE_MISMATCH"];
      if (conflictCodes.includes(apiError.code)) {
        saveDraft(payload, operatorName);
        markDraft(payload.step_id, { sync_state: "CONFLICT", conflict_code: apiError.code, conflict_message: apiError.message });
        set({ drafts: listDrafts(), notice: `步骤 ${payload.step_id} 需重新选择：${apiError.message}` });
      } else {
        set({ notice: `领用失败：${apiError.message}` });
      }
      return { ok: false, error: apiError };
    }
  },

  async syncDrafts() {
    const drafts = listDrafts();
    let synced = 0;
    let conflicted = 0;
    for (const draft of drafts) {
      if (draft.sync_state === "SYNCED") continue;
      markDraft(draft.step_id, { sync_state: "SYNCING" });
      try {
        const { draft_id: _d, created_at: _c, updated_at: _u, sync_state: _s, operator_name: name, ...payload } = draft;
        await submitRequisition({ ...payload }, { operatorName: name });
        markDraft(draft.step_id, { sync_state: "SYNCED" });
        synced += 1;
      } catch (error) {
        const apiError = error as ApiError;
        markDraft(draft.step_id, { sync_state: "CONFLICT", conflict_code: apiError.code, conflict_message: apiError.message });
        conflicted += 1;
      }
    }
    clearSyncedDrafts();
    set({ drafts: listDrafts(), notice: `回网合并完成：成功 ${synced} 条，需重新选择 ${conflicted} 条` });
    return { synced, conflicted };
  },

  async backfill(stepId, batchId) {
    await backfillStepBatch(stepId, batchId);
    set({ notice: `旧步骤 ${stepId} 已按当前台账补齐批次版本` });
  },

  async loadChain(planId) {
    const chain = await fetchPlanChain(planId);
    set((state) => ({ chains: { ...state.chains, [planId]: chain } }));
    return chain;
  }
}));
