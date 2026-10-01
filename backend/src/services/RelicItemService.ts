import { relicItemRepository } from "../repositories/RelicItemRepository";

export const relicItemService = {
  list: () => relicItemRepository.findAll()
};
