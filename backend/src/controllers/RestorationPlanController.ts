import type { Request, Response } from "express";
import { restorationPlanService } from "../services/RestorationPlanService";

export const restorationPlanController = {
  list: (_req: Request, res: Response) => res.json(restorationPlanService.list()),
  get: (req: Request, res: Response) => {
    const plan = restorationPlanService.get(Number(req.params.id));
    if (!plan) return res.status(404).json({ code: "PLAN_NOT_FOUND", message: "修复方案不存在" });
    res.json(plan);
  },
  create: (req: Request, res: Response) => res.status(201).json(restorationPlanService.create(req.body)),
  /** 专家复算。 */
  recalculate: (req: Request, res: Response) => res.json(restorationPlanService.recalculate(Number(req.params.id))),
  /** 专家审批通过。 */
  approve: (req: Request, res: Response) => res.json(restorationPlanService.approve(Number(req.params.id))),
  /** 档案员归档。 */
  archive: (req: Request, res: Response) => res.json(restorationPlanService.archive(Number(req.params.id)))
};
