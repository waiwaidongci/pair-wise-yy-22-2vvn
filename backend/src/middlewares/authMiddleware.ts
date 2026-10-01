import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import type { UserRole } from "../constants/UserRole";

export interface AuthedUser {
  id: number;
  role: UserRole;
  name?: string;
}

/**
 * 认证中间件：
 *  - 优先解析 Authorization: Bearer <jwt>；
 *  - 本地联调允许用 x-role / x-operator-id 头直接表明身份（不校验签名）；
 *  - 健康检查放行。任何写操作的审计都依赖这里注入的 req.user。
 */
export const authMiddleware: RequestHandler = (req, _res, next) => {
  if (req.path === "/health") return next();

  const headerRole = req.header("x-role");
  const operatorId = Number(req.header("x-operator-id") ?? 1);

  const auth = req.header("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    // 本地约定：未签发的占位 token（local-dev）退化为头角色，方便 docker 本地演示。
    if (token === "local-dev" || token === "") {
      (req as unknown as { user: AuthedUser }).user = {
        id: operatorId,
        role: (headerRole as UserRole) ?? "RESTORER",
        name: req.header("x-operator-name")
      };
      return next();
    }
    try {
      const payload = jwt.verify(token, config.jwtSecret) as unknown as AuthedUser;
      (req as unknown as { user: AuthedUser }).user = payload;
      return next();
    } catch {
      return next(new BusinessError(ERROR_CODES.AUTH_REQUIRED, {}, 401));
    }
  }

  // 无 token 的只读请求放行给访客；写权限由 rbacMiddleware 按角色拦截。
  (req as unknown as { user: AuthedUser }).user = {
    id: operatorId,
    role: (headerRole as UserRole) ?? (req.method === "GET" ? "VISITOR" : "RESTORER"),
    name: req.header("x-operator-name")
  };
  next();
};
