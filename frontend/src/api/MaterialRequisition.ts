import { mockData } from "../mocks/seedData";
import type { MaterialRequisition, SubmitRequisitionResult } from "../types/MaterialRequisition";

const endpoint = "/api/material-requisition";

export async function listMaterialRequisition(): Promise<MaterialRequisition[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && true) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // 离线时回退到本地种子数据。
    }
  }
  return [...(mockData.materialRequisition as unknown as MaterialRequisition[])];
}

export interface SubmitRequisitionPayload {
  step_id: number;
  batch_id: number;
  qty: number;
  request_no: string;
  operator_id?: number;
  base_ledger_version?: number;
}

/**
 * 提交领用。失败时抛出带 code 的错误，
 * 409（冲突/失效/不足）会携带 alternatives，供前端重新选择批次。
 */
export async function submitRequisition(payload: SubmitRequisitionPayload): Promise<SubmitRequisitionResult> {
  const res = await fetch(endpoint, {
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
