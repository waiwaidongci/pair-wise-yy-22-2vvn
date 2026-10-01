import { Router } from "express";
import { restorationPlanController } from "../controllers/RestorationPlanController";

const router = Router();

router.get("/", restorationPlanController.list);
router.get("/:id", restorationPlanController.get);
router.post("/", restorationPlanController.create);
/** 专家复算。 */
router.post("/:id/recalculate", restorationPlanController.recalculate);
/** 专家审批通过。 */
router.post("/:id/approve", restorationPlanController.approve);
/** 档案员归档。 */
router.post("/:id/archive", restorationPlanController.archive);

export default router;
