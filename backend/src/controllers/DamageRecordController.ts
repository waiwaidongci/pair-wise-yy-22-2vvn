import type { Request, Response } from "express";
import { damageRecordService } from "../services/DamageRecordService";
import { asyncHandler } from "./controllerSupport";

export const damageRecordController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await damageRecordService.list());
  })
};
