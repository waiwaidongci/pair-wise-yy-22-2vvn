import { http } from "./http";
import type { ImageVersion } from "../types/ImageVersion";

const endpoint = "/image-version";

export async function listImageVersion(): Promise<ImageVersion[]> {
  return http.get<ImageVersion[]>(endpoint);
}

/** 将影像版本登记为某步骤的凭证（供领用/完成时引用）。 */
export const bindImageToStep = (imageVersionId: number, stepId: number) =>
  http.post<ImageVersion>(`${endpoint}/${imageVersionId}/bind-step/${stepId}`, {}, { role: "RESTORER" });
