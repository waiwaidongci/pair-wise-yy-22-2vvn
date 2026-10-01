import type { RequestHandler } from "express";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import type { UserRole } from "../constants/UserRole";
import type { AuthedUser } from "./authMiddleware";

/**
 * RBAC 中间件：按角色白名单放行。
 * 角色来自 authMiddleware 注入的 req.user，前端按钮显隐只是体验，最终以此为准。
 */
export const rbacMiddleware =
  (roles: UserRole[] = []): RequestHandler =>
  (req, _res, next) => {
    if (roles.length === 0) return next();
    const user = (req as unknown as { user?: AuthedUser }).user;
    if (!user) return next(new BusinessError(ERROR_CODES.AUTH_REQUIRED, {}, 401));
    if (!roles.includes(user.role)) {
      return next(new BusinessError(ERROR_CODES.RBAC_DENIED, { roles: roles.join(","), actual: user.role }, 403));
    }
    next();
  };
