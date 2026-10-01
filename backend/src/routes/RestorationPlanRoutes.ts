import { Router } from "express";
import { restorationPlanController } from "../controllers/RestorationPlanController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

/**
 * 修复方案路由。
 * 提交：修复师；复算通过：专家；归档：档案员（rbac 中间件按角色放行，业务层再兜底）。
 */
const router = Router();
router.get("/", restorationPlanController.list);
router.post("/:planId/submit", rbacMiddleware(["RESTORER"]), restorationPlanController.submit);
router.post("/:planId/recalculate", rbacMiddleware(["EXPERT"]), restorationPlanController.recalculate);
router.post("/:planId/reject", rbacMiddleware(["EXPERT"]), restorationPlanController.reject);
router.post("/:planId/archive", rbacMiddleware(["ARCHIVIST"]), restorationPlanController.archive);

export default router;
