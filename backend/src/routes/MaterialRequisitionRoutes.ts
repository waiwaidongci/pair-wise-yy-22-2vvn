import { Router } from "express";
import { materialRequisitionController } from "../controllers/MaterialRequisitionController";

/**
 * 材料领用链路由。
 * POST /            修复师提交批次用量（request_id 幂等）
 * POST /steps/:id/backfill  旧步骤按当前台账补齐批次版本
 * GET  /plan/:id    方案领用链台账（专家复算核对）
 */
const router = Router();
router.post("/", materialRequisitionController.submit);
router.post("/steps/:stepId/backfill", materialRequisitionController.backfill);
router.get("/plan/:planId", materialRequisitionController.chainByPlan);

export default router;
