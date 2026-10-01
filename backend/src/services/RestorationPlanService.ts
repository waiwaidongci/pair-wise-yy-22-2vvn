import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { materialRequisitionService } from "./MaterialRequisitionService";
import type { RestorationPlan } from "../models/RestorationPlan";

export const restorationPlanService = {
  list(): RestorationPlan[] {
    return restorationPlanRepository.findAll();
  },

  get(id: number): RestorationPlan | undefined {
    return restorationPlanRepository.findById(id);
  },

  create(row: Partial<RestorationPlan>): RestorationPlan {
    return restorationPlanRepository.save(row);
  },

  /** 专家复算：核对步骤批次版本、影像凭证与台账。 */
  recalculate(id: number) {
    return materialRequisitionService.recalculatePlan(id);
  },

  /** 专家审批通过：必须先复算。 */
  approve(id: number) {
    return materialRequisitionService.approvePlan(id);
  },

  /** 档案员归档：归档后禁止领用。 */
  archive(id: number) {
    return materialRequisitionService.archivePlan(id);
  }
};
