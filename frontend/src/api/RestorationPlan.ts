import { http } from "./http";
import type { RestorationPlan } from "../types/RestorationPlan";

const endpoint = "/restoration-plan";

export async function listRestorationPlan(): Promise<RestorationPlan[]> {
  return http.get<RestorationPlan[]>(endpoint);
}

export const submitPlanForApproval = (planId: number) =>
  http.post<RestorationPlan>(`${endpoint}/${planId}/submit`, {}, { role: "RESTORER" });

/** 专家复算后通过：recalculated_total 必须等于台账实际用量。 */
export const approveWithRecalculation = (planId: number, recalculatedTotal: number) =>
  http.post<RestorationPlan>(`${endpoint}/${planId}/recalculate`, { recalculated_total: recalculatedTotal }, { role: "EXPERT" });

export const rejectPlan = (planId: number, reason: string) =>
  http.post<RestorationPlan>(`${endpoint}/${planId}/reject`, { reason }, { role: "EXPERT" });

/** 档案员归档：归档后方案冻结，禁止再领用。 */
export const archivePlan = (planId: number, archivistId = 3) =>
  http.post<RestorationPlan>(`${endpoint}/${planId}/archive`, {}, { role: "ARCHIVIST", operatorId: archivistId });
