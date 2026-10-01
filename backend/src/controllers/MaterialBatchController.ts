import type { Request, Response } from "express";
import { materialBatchService } from "../services/MaterialBatchService";

export const materialBatchController = {
  list: (_req: Request, res: Response) => res.json(materialBatchService.list()),
  get: (req: Request, res: Response) => {
    const batch = materialBatchService.get(Number(req.params.id));
    if (!batch) return res.status(404).json({ code: "BATCH_NOT_FOUND", message: "材料批次不存在" });
    res.json(batch);
  },
  create: (req: Request, res: Response) => res.status(201).json(materialBatchService.create(req.body)),
  recall: (req: Request, res: Response) => res.json(materialBatchService.recall(Number(req.params.id))),
  expire: (req: Request, res: Response) => res.json(materialBatchService.expire(Number(req.params.id))),
  deplete: (req: Request, res: Response) => res.json(materialBatchService.deplete(Number(req.params.id))),
  alternatives: (req: Request, res: Response) => {
    const stepId = Number(req.query.step_id);
    const qty = Number(req.query.qty ?? 1);
    res.json(materialBatchService.alternatives(stepId, qty));
  }
};
