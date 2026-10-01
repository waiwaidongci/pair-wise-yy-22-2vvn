import { readSnapshot, withTransaction } from "../store/jsonStore";
import { nextId, appendAuditLog } from "../repositories/repoSupport";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import type { ImageVersion } from "../models/ImageVersion";

/**
 * 影像版本服务：上传登记、绑定步骤凭证、归档。
 * 材料领用只能引用 step_id 相同的影像版本，从数据源头保证审批与凭证一致。
 */
export const imageVersionService = {
  async list(): Promise<ImageVersion[]> {
    const db = await readSnapshot();
    return db.imageVersion;
  },

  async create(row: {
    relic_id: number;
    plan_id: number;
    step_id?: number | null;
    version_no: string;
    image_type: string;
    file_path: string;
    capture_at?: string;
    note?: string;
  }, actor: string): Promise<ImageVersion> {
    return withTransaction((draft) => {
      const image: ImageVersion = {
        id: nextId(draft, "imageVersion"),
        relic_id: row.relic_id,
        plan_id: row.plan_id,
        step_id: row.step_id ?? null,
        version_no: row.version_no,
        image_type: row.image_type,
        file_path: row.file_path,
        capture_at: row.capture_at ?? new Date().toISOString(),
        note: row.note ?? "",
        archived: false
      };
      draft.imageVersion.push(image);
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.ImageVersion[0], targetType: "ImageVersion", targetId: image.id, detail: `影像版本上传 ${image.version_no}` });
      return image;
    });
  },

  /** 将影像版本绑定为某步骤的凭证（允许补绑旧步骤的执行影像）。 */
  async bindStep(imageVersionId: number, stepId: number, actor: string): Promise<ImageVersion> {
    return withTransaction((draft) => {
      const image = draft.imageVersion.find((row) => row.id === imageVersionId);
      if (!image) throw BusinessError.validation(`image version ${imageVersionId} not found`);
      const step = draft.restorationStep.find((row) => row.id === stepId);
      if (!step) throw BusinessError.notFound(ERROR_CODES.STEP_NOT_FOUND, { stepId });
      if (image.plan_id !== step.plan_id) {
        throw new BusinessError(ERROR_CODES.STEP_IMAGE_MISMATCH, { imageVersionId, stepId }, 422);
      }
      image.step_id = stepId;
      appendAuditLog(draft, { actor, action: LOG_TEMPLATES.ImageVersion[2], targetType: "ImageVersion", targetId: imageVersionId, detail: `影像凭证绑定步骤 ${stepId}` });
      return image;
    });
  }
};
