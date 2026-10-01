import type { Request, Response } from "express";
import { imageVersionService } from "../services/ImageVersionService";

export const imageVersionController = {
  list: (req: Request, res: Response) => {
    if (req.query.plan_id) return res.json(imageVersionService.listByPlan(Number(req.query.plan_id)));
    if (req.query.requisition_id)
      return res.json(imageVersionService.listByRequisition(Number(req.query.requisition_id)));
    res.json(imageVersionService.list());
  },
  create: (req: Request, res: Response) => res.status(201).json(imageVersionService.create(req.body))
};
