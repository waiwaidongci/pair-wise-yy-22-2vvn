import { relicItemRepository } from "../repositories/RelicItemRepository";
import type { RelicItem } from "../models/RelicItem";

export const relicItemService = {
  list: (): RelicItem[] => relicItemRepository.findAll(),
  create: (row: Partial<RelicItem>): RelicItem => relicItemRepository.save(row)
};
