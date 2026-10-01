import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import type { ImageVersion } from "../models/ImageVersion";

export const imageVersionService = {
  list(): ImageVersion[] {
    return imageVersionRepository.findAll();
  },

  listByPlan(planId: number): ImageVersion[] {
    return imageVersionRepository.findByPlan(planId);
  },

  listByRequisition(requisitionId: number): ImageVersion[] {
    return imageVersionRepository.findByRequisition(requisitionId);
  },

  create(row: Partial<ImageVersion>): ImageVersion {
    return imageVersionRepository.save(row);
  }
};
