import { http } from "./http";
import type { RestorationStep } from "../types/RestorationStep";

const endpoint = "/restoration-step";

export async function listRestorationStep(): Promise<RestorationStep[]> {
  return http.get<RestorationStep[]>(endpoint);
}

/** 获取步骤执行锁（两名修复师并发的第一道闸）。 */
export const acquireStepLock = (stepId: number, operatorId: number, operatorName: string) =>
  http.post<RestorationStep>(`${endpoint}/${stepId}/lock`, {}, { role: "RESTORER", operatorId, operatorName });

export const releaseStepLock = (stepId: number, operatorId: number) =>
  http.post<RestorationStep>(`${endpoint}/${stepId}/unlock`, {}, { role: "RESTORER", operatorId });

/** 完成步骤：必须携带属于本步骤的影像凭证版本。 */
export const finishStep = (stepId: number, imageVersionId: number, operatorId: number) =>
  http.post<RestorationStep>(`${endpoint}/${stepId}/finish`, { image_version_id: imageVersionId }, { role: "RESTORER", operatorId });
