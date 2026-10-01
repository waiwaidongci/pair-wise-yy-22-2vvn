import { ledgerDatabase } from "../db/ledgerDatabase";
import type { RelicItem } from "../models/RelicItem";

export const relicItemRepository = {
  findAll: (): RelicItem[] => ledgerDatabase.list<RelicItem>("relicItem"),
  findById: (id: number): RelicItem | undefined => ledgerDatabase.findById<RelicItem>("relicItem", id),
  save: (row: Partial<RelicItem> & { id?: number }): RelicItem =>
    ledgerDatabase.insert<RelicItem>("relicItem", row as RelicItem),
  update: (id: number, patch: Partial<RelicItem>): RelicItem | undefined =>
    ledgerDatabase.update<RelicItem>("relicItem", id, patch)
};
