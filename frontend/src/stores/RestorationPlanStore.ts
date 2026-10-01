import { create } from "zustand";
import { listRestorationPlan, recalculatePlan, approvePlan, archivePlan } from "../api/RestorationPlan";
import type { RestorationPlan } from "../types/RestorationPlan";
import type { RecalcResult } from "../api/RestorationPlan";

type State = {
  rows: RestorationPlan[];
  loading: boolean;
  load: () => Promise<void>;
  recalculate: (id: number) => Promise<RecalcResult>;
  approve: (id: number) => Promise<RestorationPlan>;
  archive: (id: number) => Promise<RestorationPlan>;
};

export const useRestorationPlanStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listRestorationPlan(), loading: false });
  },
  async recalculate(id) {
    const result = await recalculatePlan(id);
    set({ rows: get().rows.map((row) => (row.id === id ? result.plan : row)) });
    return result;
  },
  async approve(id) {
    const plan = await approvePlan(id);
    set({ rows: get().rows.map((row) => (row.id === id ? plan : row)) });
    return plan;
  },
  async archive(id) {
    const plan = await archivePlan(id);
    set({ rows: get().rows.map((row) => (row.id === id ? plan : row)) });
    return plan;
  }
}));
