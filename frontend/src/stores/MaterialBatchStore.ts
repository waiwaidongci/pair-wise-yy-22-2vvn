import { create } from "zustand";
import { listMaterialBatches, recallMaterialBatch, expireMaterialBatch, replenishMaterialBatch } from "../api/MaterialBatch";
import type { MaterialBatch } from "../types/MaterialBatch";

type BatchState = {
  rows: MaterialBatch[];
  loading: boolean;
  notice: string | null;
  load: () => Promise<void>;
  recall: (batchId: number) => Promise<{ affected_steps: number[] }>;
  expire: (batchId: number) => Promise<{ affected_steps: number[] }>;
  replenish: (batchId: number, amount: number) => Promise<void>;
};

export const useMaterialBatchStore = create<BatchState>((set, get) => ({
  rows: [],
  loading: false,
  notice: null,

  async load() {
    set({ loading: true });
    try {
      set({ rows: await listMaterialBatches(), loading: false });
    } catch (error) {
      set({ loading: false, notice: `批次台账加载失败：${(error as Error).message}` });
    }
  },

  async recall(batchId) {
    const result = await recallMaterialBatch(batchId);
    await get().load();
    set({ notice: `批次召回完成，退回重算步骤：${result.affected_steps.join("、") || "无（已完成步骤保留原用量）"}` });
    return { affected_steps: result.affected_steps };
  },

  async expire(batchId) {
    const result = await expireMaterialBatch(batchId);
    await get().load();
    set({ notice: `批次过期处置完成，退回重算步骤：${result.affected_steps.join("、") || "无"}` });
    return { affected_steps: result.affected_steps };
  },

  async replenish(batchId, amount) {
    await replenishMaterialBatch(batchId, amount);
    await get().load();
    set({ notice: `批次 ${batchId} 补货 ${amount}` });
  }
}));
