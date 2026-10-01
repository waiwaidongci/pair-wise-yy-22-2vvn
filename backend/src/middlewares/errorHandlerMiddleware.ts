import type { ErrorRequestHandler } from "express";

export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err.status ?? 500;
  const code = err.code ?? "INTERNAL_ERROR";
  const body: Record<string, unknown> = { code, message: err.message };
  if (err.details !== undefined) body.details = err.details;
  res.status(status).json(body);
};
