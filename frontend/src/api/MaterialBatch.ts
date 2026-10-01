import { http } from "./http";
import type { MaterialBatch } from "../types/MaterialBatch";

const endpoint = "/material-batch";

/** 材料批次台账查询与处置。 */
export const listMaterialBatches = (options?: { role?: string }) =>
  http.get<MaterialBatch[]>(endpoint, options);

export const recallMaterialBatch = (batchId: number, role = "RESTORER") =>
  http.post<{ batch: MaterialBatch; affected_steps: number[]; alternatives: MaterialBatch[] }>(
    `${endpoint}/${batchId}/recall`,
    {},
    { role }
  );

export const expireMaterialBatch = (batchId: number, role = "RESTORER") =>
  http.post<{ batch: MaterialBatch; affected_steps: number[]; alternatives: MaterialBatch[] }>(
    `${endpoint}/${batchId}/expire`,
    {},
    { role }
  );

export const replenishMaterialBatch = (batchId: number, amount: number, role = "RESTORER") =>
  http.post<MaterialBatch>(`${endpoint}/${batchId}/replenish`, { amount }, { role });
