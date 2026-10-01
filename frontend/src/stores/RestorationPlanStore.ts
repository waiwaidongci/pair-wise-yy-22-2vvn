import { create } from "zustand";
import {
  listRestorationPlan,
  approveWithRecalculation,
  rejectPlan,
  archivePlan
} from "../api/RestorationPlan";
import type { RestorationPlan } from "../types/RestorationPlan";

type PlanState = {
  rows: RestorationPlan[];
  loading: boolean;
  notice: string | null;
  load: () => Promise<void>;
  /** 专家复算后通过：复算总量必须等于台账，否则服务端拒绝。 */
  recalculate: (planId: number, total: number) => Promise<boolean>;
  reject: (planId: number, reason: string) => Promise<boolean>;
  /** 档案员归档：成功后方案冻结。 */
  archive: (planId: number) => Promise<boolean>;
  clearNotice: () => void;
};

export const useRestorationPlanStore = create<PlanState>((set, get) => ({
  rows: [],
  loading: false,
  notice: null,
  clearNotice: () => set({ notice: null }),

  async load() {
    set({ loading: true });
    try {
      set({ rows: await listRestorationPlan(), loading: false });
    } catch (error) {
      set({ loading: false, notice: `方案加载失败：${(error as Error).message}` });
    }
  },

  async recalculate(planId, total) {
    try {
      await approveWithRecalculation(planId, total);
      await get().load();
      set({ notice: `方案 ${planId} 复算通过：实际总用量 ${total}` });
      return true;
    } catch (error) {
      set({ notice: `复算未通过：${(error as Error).message}` });
      return false;
    }
  },

  async reject(planId, reason) {
    await rejectPlan(planId, reason).catch(() => undefined);
    await get().load();
    return true;
  },

  async archive(planId) {
    try {
      await archivePlan(planId);
      await get().load();
      set({ notice: `方案 ${planId} 已归档，此后禁止再领用` });
      return true;
    } catch (error) {
      set({ notice: `归档失败：${(error as Error).message}` });
      return false;
    }
  }
}));
