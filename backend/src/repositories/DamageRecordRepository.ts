import { readSnapshot } from "../store/jsonStore";
import type { DamageRecord } from "../models/DamageRecord";

export const damageRecordRepository = {
  async findAll(): Promise<DamageRecord[]> {
    const db = await readSnapshot();
    return db.damageRecord;
  }
};
