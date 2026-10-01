import { Router } from "express";
import { materialBatchController } from "../controllers/MaterialBatchController";

/** 材料批次台账路由：入库、补货、召回、过期（失效动作级联退回未完成步骤）。 */
const router = Router();
router.get("/", materialBatchController.list);
router.post("/", materialBatchController.create);
router.post("/:batchId/replenish", materialBatchController.replenish);
router.post("/:batchId/recall", materialBatchController.recall);
router.post("/:batchId/expire", materialBatchController.expire);

export default router;
