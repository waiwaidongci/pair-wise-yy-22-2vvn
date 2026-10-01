import { readSnapshot, withTransaction } from "../store/jsonStore";
import { nextId } from "./repoSupport";
import type { MaterialRequisition } from "../models/MaterialRequisition";
import type { DatabaseShape } from "../models/DatabaseShape";
import type { RequisitionStatus } from "../constants/RequisitionStatus";

/**
 * 领用单数据访问。幂等以 request_id 为唯一业务键：
 * 同一请求号无论重试多少次，只会生成一条领用单、只扣一次余量。
 */
export const materialRequisitionRepository = {
  async findByStep(stepId: number): Promise<MaterialRequisition[]> {
    const db = await readSnapshot();
    return db.materialRequisition.filter((row) => row.step_id === stepId);
  },

  async findByPlan(planId: number): Promise<MaterialRequisition[]> {
    const db = await readSnapshot();
    return db.materialRequisition.filter((row) => row.plan_id === planId);
  },

  findByRequestId(draft: DatabaseShape, requestId: string): MaterialRequisition | undefined {
    return draft.materialRequisition.find((row) => row.request_id === requestId);
  },

  insert(
    draft: DatabaseShape,
    row: Omit<MaterialRequisition, "id">
  ): MaterialRequisition {
    const record: MaterialRequisition = { ...row, id: nextId(draft, "materialRequisition") };
    draft.materialRequisition.push(record);
    return record;
  },

  async lockByPlan(planId: number, actor: string): Promise<number> {
    return withTransaction((draft) => {
      let count = 0;
      for (const row of draft.materialRequisition) {
        if (row.plan_id === planId && !row.locked) {
          row.locked = true;
          if (row.status === "CONSUMED") row.status = "LOCKED" as RequisitionStatus;
          row.finalized_at = new Date().toISOString();
          count += 1;
        }
      }
      return count;
    });
  }
};
