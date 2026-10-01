import { readSnapshot, withTransaction } from "../store/jsonStore";
import { appendAuditLog, nextId } from "./repoSupport";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { RestorationPlan } from "../models/RestorationPlan";
import type { DatabaseShape } from "../models/DatabaseShape";

/** 修复方案数据访问：审批、复算、归档状态机由 service 在事务内驱动。 */
export const restorationPlanRepository = {
  async findAll(): Promise<RestorationPlan[]> {
    const db = await readSnapshot();
    return db.restorationPlan;
  },

  findById(draft: DatabaseShape, id: number): RestorationPlan | undefined {
    return draft.restorationPlan.find((plan) => plan.id === id);
  },

  async create(row: Omit<RestorationPlan, "id" | "material_rechecked" | "recalculated_total" | "ledger_total" | "archived_at" | "archived_by">): Promise<RestorationPlan> {
    return withTransaction((draft) => {
      const plan: RestorationPlan = {
        ...row,
        id: nextId(draft, "restorationPlan"),
        material_rechecked: false,
        recalculated_total: null,
        ledger_total: null,
        archived_at: null,
        archived_by: null
      };
      draft.restorationPlan.push(plan);
      appendAuditLog(draft, { actor: `user:${plan.owner_id}`, action: LOG_TEMPLATES.RestorationPlan[0], targetType: "RestorationPlan", targetId: plan.id, detail: `方案编制 ${plan.plan_title}` });
      return plan;
    });
  }
};
