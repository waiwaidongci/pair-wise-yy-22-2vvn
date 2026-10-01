import { readSnapshot, withTransaction } from "../store/jsonStore";
import { appendAuditLog, nextId } from "./repoSupport";
import type { MaterialBatch } from "../models/MaterialBatch";
import type { DatabaseShape } from "../models/DatabaseShape";
import { LOG_TEMPLATES } from "../constants/logTemplates";

/**
 * 材料批次台账数据访问。
 * remaining_quantity 仅由领用链（扣减/冲回/补货）在事务内修改，
 * repository 不对外暴露裸写余量的方法。
 */
export const materialBatchRepository = {
  async findAll(): Promise<MaterialBatch[]> {
    const db = await readSnapshot();
    return db.materialBatch;
  },

  findById(draft: DatabaseShape, id: number): MaterialBatch | undefined {
    return draft.materialBatch.find((row) => row.id === id);
  },

  /** 同材料替代批次：优先同材料、合格、余量充足，按过期时间远近排序。 */
  findAlternatives(draft: DatabaseShape, materialName: string, needed: number, excludeBatchId: number): MaterialBatch[] {
    const now = Date.now();
    return draft.materialBatch
      .filter(
        (batch) =>
          batch.id !== excludeBatchId &&
          batch.material_name === materialName &&
          batch.status === "ACTIVE" &&
          batch.remaining_quantity >= needed &&
          new Date(batch.expires_at).getTime() > now
      )
      .sort((a, b) => a.expires_at.localeCompare(b.expires_at));
  },

  async create(row: Omit<MaterialBatch, "id" | "created_at" | "updated_at" | "remaining_quantity"> & { remaining_quantity?: number }, actor: string): Promise<MaterialBatch> {
    return withTransaction((draft) => {
      const ts = new Date().toISOString();
      const batch: MaterialBatch = {
        ...row,
        id: nextId(draft, "materialBatch"),
        remaining_quantity: row.remaining_quantity ?? row.total_quantity,
        created_at: ts,
        updated_at: ts
      };
      draft.materialBatch.push(batch);
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.MaterialBatch[0], targetType: "MaterialBatch", targetId: batch.id, detail: `批次入库 ${batch.batch_no}` });
      return batch;
    });
  },

  /** 批次处置（召回/过期）：只改台账状态，步骤级联由 MaterialBatchService 处理。 */
  async markStatus(batchId: number, status: MaterialBatch["status"], actor: string): Promise<MaterialBatch> {
    return withTransaction((draft) => {
      const batch = draft.materialBatch.find((row) => row.id === batchId);
      if (!batch) throw new Error(`BATCH_NOT_FOUND:${batchId}`);
      batch.status = status;
      batch.updated_at = new Date().toISOString();
      if (status === "RECALLED") batch.recalled_at = batch.updated_at;
      const action = status === "RECALLED" ? LOG_TEMPLATES.MaterialBatch[2] : LOG_TEMPLATES.MaterialBatch[3];
      appendAuditLog(draft, { actor, action, targetType: "MaterialBatch", targetId: batchId, detail: `批次 ${batch.batch_no} 标记为 ${status}` });
      return batch;
    });
  }
};
