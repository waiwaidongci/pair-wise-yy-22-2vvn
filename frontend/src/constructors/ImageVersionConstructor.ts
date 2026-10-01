import type { ImageVersion } from "../types/ImageVersion";

export const createDefaultImageVersion = (overrides: Partial<ImageVersion> = {}): ImageVersion => ({
  id: 0,
  relic_id: 0,
  plan_id: 0,
  step_id: null,
  version_no: "V1",
  image_type: "PROCESS",
  file_path: "",
  capture_at: "",
  note: "",
  archived: false,
  ...overrides
});

export const createImageVersionForm = createDefaultImageVersion;
export const createImageVersionResponse = createDefaultImageVersion;
