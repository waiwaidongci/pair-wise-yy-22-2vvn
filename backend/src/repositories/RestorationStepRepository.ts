import { readSnapshot, withTransaction } from "../store/jsonStore";
import type { RestorationStep } from "../models/RestorationStep";
import type { DatabaseShape } from "../models/DatabaseShape";

/**
 * 修复步骤数据访问。步骤是领用链的挂载点：
 * 批次/用量/影像凭证/执行锁/乐观版本都挂在这里，
 * 但跨实体的一致性校验统一放在 RestorationStepService 的事务里。
 */
export const restorationStepRepository = {
  async findAll(): Promise<RestorationStep[]> {
    const db = await readSnapshot();
    return db.restorationStep;
  },

  async findByPlan(planId: number): Promise<RestorationStep[]> {
    const db = await readSnapshot();
    return db.restorationStep.filter((step) => step.plan_id === planId);
  },

  findById(draft: DatabaseShape, id: number): RestorationStep | undefined {
    return draft.restorationStep.find((step) => step.id === id);
  },

  async save(row: Partial<RestorationStep> & { id: number }, actor: string): Promise<RestorationStep> {
    return withTransaction((draft) => {
      const existing = this.findById(draft, row.id);
      if (!existing) throw new Error(`STEP_NOT_FOUND:${row.id}`);
      Object.assign(existing, row, { updated_at: new Date().toISOString() });
      existing.base_version += 1;
      return existing;
    });
  }
};
