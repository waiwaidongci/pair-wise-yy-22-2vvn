import { readSnapshot } from "../store/jsonStore";
import type { RelicItem } from "../models/RelicItem";

export const relicItemRepository = {
  async findAll(): Promise<RelicItem[]> {
    const db = await readSnapshot();
    return db.relicItem;
  }
};
