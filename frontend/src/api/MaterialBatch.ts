import { mockData } from "../mocks/seedData";
import type { MaterialBatch } from "../types/MaterialBatch";

const endpoint = "/api/material-batch";

export async function listMaterialBatch(): Promise<MaterialBatch[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && true) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // 离线时回退到本地种子数据。
    }
  }
  return [...(mockData.materialBatch as unknown as MaterialBatch[])];
}

export async function listAlternatives(stepId: number, qty: number): Promise<MaterialBatch[]> {
  try {
    const res = await fetch(`${endpoint}/alternatives?step_id=${stepId}&qty=${qty}`);
    if (res.ok) return await res.json();
  } catch {
    // 离线回退。
  }
  return (mockData.materialBatch as unknown as MaterialBatch[]).filter(
    (batch) => batch.status === "ACTIVE" && batch.remaining_qty >= qty
  );
}

export async function recallMaterialBatch(id: number): Promise<unknown> {
  const res = await fetch(`${endpoint}/${id}/recall`, { method: "POST" });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function expireMaterialBatch(id: number): Promise<unknown> {
  const res = await fetch(`${endpoint}/${id}/expire`, { method: "POST" });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function depleteMaterialBatch(id: number): Promise<unknown> {
  const res = await fetch(`${endpoint}/${id}/deplete`, { method: "POST" });
  if (!res.ok) throw await res.json();
  return await res.json();
}
