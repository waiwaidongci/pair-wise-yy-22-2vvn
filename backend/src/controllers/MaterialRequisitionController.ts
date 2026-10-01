import type { Response, Request } from "express";
import { materialRequisitionService } from "../services/MaterialRequisitionService";
import { asyncHandler, actorOf } from "./controllerSupport";
import type { RequisitionSubmitPayload } from "../types/RequisitionPayload";
import { createRequisitionDtoFromResult } from "../constructors/MaterialRequisitionDtoFactory";

/**
 * 材料领用控制器：修复师在步骤上提交批次用量、旧步骤补齐、链路查询。
 * controller 只做取参与响应成形，业务规则一律在 service 事务内。
 */
export const materialRequisitionController = {
  /** POST /api/material-requisition —— 提交批次用量（按 request_id 幂等） */
  submit: asyncHandler(async (req: Request, res: Response) => {
    const { actor, operatorId, operatorName } = actorOf(req);
    const body = req.body as RequisitionSubmitPayload;
    const payload: RequisitionSubmitPayload = {
      request_id: String(body.request_id),
      step_id: Number(body.step_id),
      batch_id: Number(body.batch_id),
      quantity: Number(body.quantity),
      image_version_id: body.image_version_id ?? null,
      operator_id: body.operator_id ?? operatorId,
      operator_name: operatorName,
      base_version: Number(body.base_version ?? 0),
      draft_only: body.draft_only ?? false
    };
    const result = await materialRequisitionService.submit(payload, actor);
    res.status(result.idempotent ? 200 : 201).json(createRequisitionDtoFromResult(result));
  }),

  /** POST /api/material-requisition/steps/:stepId/backfill —— 旧步骤按当前台账补齐批次版本 */
  backfill: asyncHandler(async (req: Request, res: Response) => {
    const { actor } = actorOf(req);
    const stepId = Number(req.params.stepId);
    const preferredBatchId = req.body?.batch_id != null ? Number(req.body.batch_id) : null;
    const step = await materialRequisitionService.backfillStep(stepId, preferredBatchId, actor);
    res.json(step);
  }),

  /** GET /api/material-requisition/plan/:planId —— 方案领用链台账（专家复算核对） */
  chainByPlan: asyncHandler(async (req: Request, res: Response) => {
    const planId = Number(req.params.planId);
    const chain = await materialRequisitionService.chainByPlan(planId);
    res.json({ ...chain, batchMap: undefined });
  })
};
