import type { Request, Response } from "express";
import { restorationStepService } from "../services/RestorationStepService";

export const restorationStepController = {
  list: (_req: Request, res: Response) => res.json(restorationStepService.list()),
  listByPlan: (req: Request, res: Response) => res.json(restorationStepService.listByPlan(Number(req.query.plan_id))),
  create: (req: Request, res: Response) => res.status(201).json(restorationStepService.create(req.body)),
  /** 修复师在步骤上提交批次和用量。 */
  requisition: (req: Request, res: Response) => {
    const result = restorationStepService.requisition(req.body);
    res.status(result.idempotent ? 200 : 201).json(result);
  },
  /** 补齐旧步骤的批次版本。 */
  backfill: (_req: Request, res: Response) => res.json(restorationStepService.backfill())
};
