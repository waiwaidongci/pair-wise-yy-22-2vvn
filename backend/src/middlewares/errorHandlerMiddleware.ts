import type { ErrorRequestHandler } from "express";
import { BusinessError } from "../utils/BusinessError";

/**
 * 全局错误处理：统一错误信封 { code, message, details }。
 * service/controller 已先行包装业务异常，这里只负责兜底与序列化，
 * 不吞掉任何业务语义。
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof BusinessError) {
    return res.status(err.status).json({ code: err.code, message: err.message, details: err.details });
  }
  const status = (err as { status?: number })?.status ?? 500;
  const code = (err as { code?: string })?.code ?? "INTERNAL_ERROR";
  // eslint-disable-next-line no-console
  console.error("[errorHandler]", err);
  res.status(status).json({ code, message: (err as Error)?.message ?? "internal error" });
};
