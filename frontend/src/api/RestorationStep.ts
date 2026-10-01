import { mockData } from "../mocks/seedData";
import type { RestorationStep } from "../types/RestorationStep";
import type { SubmitRequisitionPayload } from "./MaterialRequisition";
import type { SubmitRequisitionResult } from "../types/MaterialRequisition";

const endpoint = "/api/restoration-step";

export async function listRestorationStep(): Promise<RestorationStep[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && true) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return [...(mockData.restorationStep as unknown as RestorationStep[])];
}

export async function saveRestorationStep(payload: RestorationStep) {
  console.info("save RestorationStep", payload);
  return payload;
}

/** 修复师在步骤上提交批次和用量（幂等 + 冲突检测）。 */
export async function submitStepRequisition(payload: SubmitRequisitionPayload): Promise<SubmitRequisitionResult> {
  const res = await fetch(`${endpoint}/requisition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data?.message ?? "领用失败") as Error & {
      code?: string;
      alternatives?: SubmitRequisitionResult["alternatives"];
      details?: unknown;
    };
    error.code = data?.code;
    error.alternatives = data?.details?.alternatives;
    error.details = data?.details;
    throw error;
  }
  return data as SubmitRequisitionResult;
}

/** 补齐旧步骤的批次版本。 */
export async function backfillStepBatches(): Promise<{ backfilled: number; steps: RestorationStep[] }> {
  const res = await fetch(`${endpoint}/backfill`, { method: "POST" });
  if (!res.ok) throw await res.json();
  return await res.json();
}
