import type { Request, Response } from "express";
import { materialRequisitionService } from "../services/MaterialRequisitionService";

export const materialRequisitionController = {
  list: (_req: Request, res: Response) => res.json(materialRequisitionService.list()),
  create: (req: Request, res: Response) => {
    const result = materialRequisitionService.submit(req.body);
    res.status(result.idempotent ? 200 : 201).json(result);
  }
};
