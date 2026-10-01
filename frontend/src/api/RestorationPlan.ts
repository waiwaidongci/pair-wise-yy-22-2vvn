import { mockData } from "../mocks/seedData";
import type { RestorationPlan } from "../types/RestorationPlan";

const endpoint = "/api/restoration-plan";

export async function listRestorationPlan(): Promise<RestorationPlan[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && true) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return [...(mockData.restorationPlan as unknown as RestorationPlan[])];
}

export async function saveRestorationPlan(payload: RestorationPlan) {
  console.info("save RestorationPlan", payload);
  return payload;
}

export interface RecalcResult {
  plan: RestorationPlan;
  ok: boolean;
  issues: Array<{ step_id: number; code: string; message: string }>;
}

/** 专家复算。 */
export async function recalculatePlan(id: number): Promise<RecalcResult> {
  const res = await fetch(`${endpoint}/${id}/recalculate`, { method: "POST" });
  if (!res.ok) throw await res.json();
  return await res.json();
}

/** 专家审批通过（必须先复算）。 */
export async function approvePlan(id: number): Promise<RestorationPlan> {
  const res = await fetch(`${endpoint}/${id}/approve`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json();
    const error = new Error(data?.message ?? "审批失败") as Error & { code?: string };
    error.code = data?.code;
    throw error;
  }
  return await res.json();
}

/** 档案员归档（归档后禁止领用）。 */
export async function archivePlan(id: number): Promise<RestorationPlan> {
  const res = await fetch(`${endpoint}/${id}/archive`, { method: "POST" });
  if (!res.ok) throw await res.json();
  return await res.json();
}
