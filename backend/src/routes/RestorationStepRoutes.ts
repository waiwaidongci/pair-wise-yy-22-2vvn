import { Router } from "express";
import { restorationStepController } from "../controllers/RestorationStepController";

const router = Router();

router.get("/", restorationStepController.list);
router.get("/by-plan", restorationStepController.listByPlan);
router.post("/", restorationStepController.create);
/** 修复师在步骤上提交批次和用量（幂等 + 冲突检测）。 */
router.post("/requisition", restorationStepController.requisition);
/** 补齐旧步骤的批次版本。 */
router.post("/backfill", restorationStepController.backfill);

export default router;
