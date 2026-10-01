import { create } from "zustand";
import { listMaterialRequisition } from "../api/MaterialRequisition";
import type { MaterialRequisition } from "../types/MaterialRequisition";

type State = {
  rows: MaterialRequisition[];
  loading: boolean;
  load: () => Promise<void>;
};

export const useMaterialRequisitionStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listMaterialRequisition(), loading: false });
  }
}));
