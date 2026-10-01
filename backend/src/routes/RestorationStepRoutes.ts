import { Router } from "express";
import { restorationStepController } from "../controllers/RestorationStepController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

/** 修复步骤路由：执行锁与完成质检限修复师；列表对审批角色开放。 */
const router = Router();
router.get("/", restorationStepController.list);
router.post("/:stepId/lock", rbacMiddleware(["RESTORER"]), restorationStepController.lock);
router.post("/:stepId/unlock", rbacMiddleware(["RESTORER"]), restorationStepController.unlock);
router.post("/:stepId/finish", rbacMiddleware(["RESTORER"]), restorationStepController.finish);

export default router;
