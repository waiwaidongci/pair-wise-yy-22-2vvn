import { Router } from "express";
import { materialBatchController } from "../controllers/MaterialBatchController";

const router = Router();

router.get("/", materialBatchController.list);
router.get("/alternatives", materialBatchController.alternatives);
router.get("/:id", materialBatchController.get);
router.post("/", materialBatchController.create);
router.post("/:id/recall", materialBatchController.recall);
router.post("/:id/expire", materialBatchController.expire);
router.post("/:id/deplete", materialBatchController.deplete);

export default router;
