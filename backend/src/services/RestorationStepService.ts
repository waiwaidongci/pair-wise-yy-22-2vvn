import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import { materialRequisitionService } from "./MaterialRequisitionService";
import type { RestorationStep } from "../models/RestorationStep";
import type { SubmitRequisitionInput } from "./MaterialRequisitionService";

export const restorationStepService = {
  list(): RestorationStep[] {
    return restorationStepRepository.findAll();
  },

  listByPlan(planId: number): RestorationStep[] {
    return restorationStepRepository.findByPlan(planId);
  },

  create(row: Partial<RestorationStep>): RestorationStep {
    return restorationStepRepository.save(row);
  },

  /** 修复师在步骤上提交批次和用量（幂等 + 冲突检测）。 */
  requisition(input: SubmitRequisitionInput) {
    return materialRequisitionService.submit(input);
  },

  /** 补齐旧步骤的批次版本。 */
  backfill() {
    return materialRequisitionService.backfillSteps();
  }
};
