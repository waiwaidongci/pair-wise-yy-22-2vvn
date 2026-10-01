import { Router } from "express";
import { relicItemController } from "../controllers/RelicItemController";

const router = Router();
router.get("/", relicItemController.list);

export default router;
