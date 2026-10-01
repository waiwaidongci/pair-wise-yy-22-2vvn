import type { Request, Response } from "express";
import { restorationPlanService } from "../services/RestorationPlanService";
import { asyncHandler, actorOf } from "./controllerSupport";

/**
 * 修复方案控制器：提交审批、专家复算通过/退回、档案员归档。
 * 通过与归档各自是独立端点，便于 RBAC 与审计分别落痕。
 */
export const restorationPlanController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await restorationPlanService.list());
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.json(await restorationPlanService.submitForApproval(Number(req.params.planId), actor));
  }),

  /** POST /api/restoration-plan/:planId/recalculate  body: { recalculated_total } */
  recalculate: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.json(
      await restorationPlanService.approveWithRecalculation(
        Number(req.params.planId),
        Number(req.body.recalculated_total),
        actor
      )
    );
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.json(await restorationPlanService.reject(Number(req.params.planId), String(req.body?.reason ?? ""), actor));
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    const { actor, operatorId } = actorOf(req);
    res.json(await restorationPlanService.archive(Number(req.params.planId), operatorId, actor));
  })
};
