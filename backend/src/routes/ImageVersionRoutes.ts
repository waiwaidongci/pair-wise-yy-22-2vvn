import { Router } from "express";
import { imageVersionController } from "../controllers/ImageVersionController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

/** 影像版本路由：上传/绑定限修复师与档案员，列表只读开放。 */
const router = Router();
router.get("/", imageVersionController.list);
router.post("/", rbacMiddleware(["RESTORER", "ARCHIVIST"]), imageVersionController.create);
router.post("/:imageVersionId/bind-step/:stepId", rbacMiddleware(["RESTORER"]), imageVersionController.bindStep);

export default router;
