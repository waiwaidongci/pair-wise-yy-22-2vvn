import { damageRecordRepository } from "../repositories/DamageRecordRepository";
import type { DamageRecord } from "../models/DamageRecord";

export const damageRecordService = {
  list: (): DamageRecord[] => damageRecordRepository.findAll(),
  create: (row: Partial<DamageRecord>): DamageRecord => damageRecordRepository.save(row)
};
