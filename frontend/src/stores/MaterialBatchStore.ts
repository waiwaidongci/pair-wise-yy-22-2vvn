import { create } from "zustand";
import { listMaterialBatch } from "../api/MaterialBatch";
import type { MaterialBatch } from "../types/MaterialBatch";

type State = {
  rows: MaterialBatch[];
  loading: boolean;
  load: () => Promise<void>;
};

export const useMaterialBatchStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listMaterialBatch(), loading: false });
  }
}));
