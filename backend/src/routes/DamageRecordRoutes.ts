import { Router } from "express";
import { damageRecordController } from "../controllers/DamageRecordController";

const router = Router();
router.get("/", damageRecordController.list);

export default router;
