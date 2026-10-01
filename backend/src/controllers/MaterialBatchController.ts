import type { Request, Response } from "express";
import { materialBatchService } from "../services/MaterialBatchService";
import { asyncHandler, actorOf } from "./controllerSupport";

/** 材料批次台账控制器：列表、入库、补货、召回、过期（后两者触发步骤级联）。 */
export const materialBatchController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await materialBatchService.list());
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.status(201).json(await materialBatchService.create(req.body, actor));
  }),

  replenish: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.json(await materialBatchService.replenish(Number(req.params.batchId), Number(req.body.amount), actor));
  }),

  recall: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.json(await materialBatchService.recall(Number(req.params.batchId), actor));
  }),

  expire: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    res.json(await materialBatchService.expire(Number(req.params.batchId), actor));
  })
};
