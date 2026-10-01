import { create } from "zustand";
import { listRestorationStep, acquireStepLock, releaseStepLock, finishStep } from "../api/RestorationStep";
import type { RestorationStep } from "../types/RestorationStep";

type StepState = {
  rows: RestorationStep[];
  loading: boolean;
  notice: string | null;
  load: () => Promise<void>;
  lock: (stepId: number, operatorId: number, operatorName: string) => Promise<RestorationStep | null>;
  unlock: (stepId: number, operatorId: number) => Promise<void>;
  finish: (stepId: number, imageVersionId: number, operatorId: number) => Promise<boolean>;
};

export const useRestorationStepStore = create<StepState>((set, get) => ({
  rows: [],
  loading: false,
  notice: null,

  async load() {
    set({ loading: true });
    try {
      set({ rows: await listRestorationStep(), loading: false });
    } catch (error) {
      set({ loading: false, notice: `步骤加载失败：${(error as Error).message}` });
    }
  },

  async lock(stepId, operatorId, operatorName) {
    try {
      const step = await acquireStepLock(stepId, operatorId, operatorName);
      await get().load();
      return step;
    } catch (error) {
      set({ notice: `获取执行锁失败：${(error as Error).message}` });
      return null;
    }
  },

  async unlock(stepId, operatorId) {
    await releaseStepLock(stepId, operatorId).catch(() => undefined);
    await get().load();
  },

  async finish(stepId, imageVersionId, operatorId) {
    try {
      await finishStep(stepId, imageVersionId, operatorId);
      await get().load();
      set({ notice: `步骤 ${stepId} 已完成，用量与影像凭证归档保留` });
      return true;
    } catch (error) {
      set({ notice: `步骤完成失败：${(error as Error).message}` });
      return false;
    }
  }
}));
