import type { Request, Response } from "express";
import { restorationStepService } from "../services/RestorationStepService";
import { asyncHandler, actorOf } from "./controllerSupport";

/**
 * 修复步骤控制器：列表、执行锁、完成质检（带影像凭证）。
 * 批次用量提交走 MaterialRequisitionController，步骤本身不直接改余量。
 */
export const restorationStepController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await restorationStepService.list());
  }),

  lock: asyncHandler(async (req: Request, res: Response) => {
    const { actor, operatorId, operatorName } = actorOf(req);
    res.json(await restorationStepService.acquireLock(Number(req.params.stepId), operatorId, operatorName, actor));
  }),

  unlock: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.json(await restorationStepService.releaseLock(Number(req.params.stepId), actor));
  }),

  /** POST /api/restoration-step/:stepId/finish  body: { image_version_id } */
  finish: asyncHandler(async (req: Request, res: Response) => {
    const { actor, operatorId } = actorOf(req);
    res.json(
      await restorationStepService.finish(
        Number(req.params.stepId),
        Number(req.body.image_version_id),
        operatorId,
        actor
      )
    );
  })
};
