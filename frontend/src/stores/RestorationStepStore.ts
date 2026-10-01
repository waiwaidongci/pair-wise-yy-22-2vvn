import { create } from "zustand";
import { listRestorationStep, submitStepRequisition, backfillStepBatches } from "../api/RestorationStep";
import type { RestorationStep } from "../types/RestorationStep";
import type { SubmitRequisitionPayload } from "../api/MaterialRequisition";
import type { SubmitRequisitionResult } from "../types/MaterialRequisition";

type State = {
  rows: RestorationStep[];
  loading: boolean;
  load: () => Promise<void>;
  requisition: (payload: SubmitRequisitionPayload) => Promise<SubmitRequisitionResult>;
  backfill: () => Promise<number>;
};

export const useRestorationStepStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listRestorationStep(), loading: false });
  },
  async requisition(payload) {
    const result = await submitStepRequisition(payload);
    // 用服务端返回的最新步骤替换本地行。
    set({ rows: get().rows.map((row) => (row.id === result.step.id ? result.step : row)) });
    return result;
  },
  async backfill() {
    const result = await backfillStepBatches();
    set({ rows: await listRestorationStep() });
    return result.backfilled;
  }
}));
