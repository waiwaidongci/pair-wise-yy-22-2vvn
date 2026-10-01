import { Router } from "express";
import { materialRequisitionController } from "../controllers/MaterialRequisitionController";

const router = Router();

router.get("/", materialRequisitionController.list);
router.post("/", materialRequisitionController.create);

export default router;
