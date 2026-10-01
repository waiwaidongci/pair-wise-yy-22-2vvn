import { readSnapshot } from "../store/jsonStore";
import type { ImageVersion } from "../models/ImageVersion";

/** 影像版本数据访问；凭证与步骤的绑定校验在领用事务中完成。 */
export const imageVersionRepository = {
  async findAll(): Promise<ImageVersion[]> {
    const db = await readSnapshot();
    return db.imageVersion;
  },

  async findById(id: number): Promise<ImageVersion | undefined> {
    const db = await readSnapshot();
    return db.imageVersion.find((row) => row.id === id);
  },

  findByIdInDraft(draft: { imageVersion: ImageVersion[] }, id: number): ImageVersion | undefined {
    return draft.imageVersion.find((row) => row.id === id);
  }
};
