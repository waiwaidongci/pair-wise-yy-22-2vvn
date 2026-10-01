import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";

/** 统一以 /api 为前缀，禁止硬编码 localhost；角色通过本地头传递（后端同约定）。 */
const BASE = "/api";

export interface ApiError {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
}

export interface RequestOptions {
  role?: string;
  operatorId?: number;
  operatorName?: string;
  signal?: AbortSignal;
}

/** 浏览器/网络是否可达；断网时调用方据此走本地草稿队列。 */
export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.role) headers["x-role"] = options.role;
  if (options.operatorId != null) headers["x-operator-id"] = String(options.operatorId);
  if (options.operatorName) headers["x-operator-name"] = options.operatorName;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const error: ApiError = {
      code: data?.code ?? "INTERNAL_ERROR",
      message: data?.message ?? `请求失败（${res.status}）`,
      details: data?.details,
      status: res.status
    };
    throw error;
  }
  return data as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, body ?? {}, options)
};

export { ERROR_CODES };
