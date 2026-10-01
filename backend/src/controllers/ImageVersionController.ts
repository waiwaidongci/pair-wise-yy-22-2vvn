import type { Request, Response } from "express";
import { imageVersionService } from "../services/ImageVersionService";
import { asyncHandler, actorOf } from "./controllerSupport";

export const imageVersionController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await imageVersionService.list());
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.status(201).json(await imageVersionService.create(req.body, actor));
  }),

  bindStep: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.json(
      await imageVersionService.bindStep(
        Number(req.params.imageVersionId),
        Number(req.params.stepId),
        actor
      )
    );
  })
};
