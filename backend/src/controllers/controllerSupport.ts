import type { NextFunction, Request, RequestHandler, Response } from "express";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";

/**
 * controller 层异步包装：把 service 抛出的裸错误（如仓储内的 NOT_FOUND 字符串）
 * 也包装成 BusinessError，再交给全局 errorHandler；禁止在全局中间件里吞掉业务语义。
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
      if (error instanceof BusinessError) return next(error);
      if (error instanceof Error) {
        const notFound = /^(STEP|PLAN|BATCH|REQUISITION|IMAGE)_NOT_FOUND:(\d+)/.exec(error.message);
        if (notFound) {
          return next(BusinessError.notFound(ERROR_CODES[`${notFound[1]}_NOT_FOUND` as keyof typeof ERROR_CODES], { id: notFound[2] }));
        }
      }
      next(error);
    });
  };

/** 从请求上下文取操作者（authMiddleware 注入），缺省给现场修复师。 */
export const actorOf = (req: Request): { actor: string; operatorId: number; operatorName: string } => {
  const user = (req as unknown as { user?: { id: number; role: string; name?: string } }).user;
  const operatorId = Number(req.header("x-operator-id") ?? user?.id ?? 0);
  const operatorName = req.header("x-operator-name") ?? user?.name ?? `修复师${operatorId}`;
  return { actor: `${(user?.role ?? "RESTORER").toLowerCase()}:${operatorId}`, operatorId, operatorName };
};
