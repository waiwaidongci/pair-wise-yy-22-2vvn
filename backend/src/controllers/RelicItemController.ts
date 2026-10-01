import type { Request, Response } from "express";
import { relicItemService } from "../services/RelicItemService";
import { asyncHandler } from "./controllerSupport";

export const relicItemController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await relicItemService.list());
  })
};
