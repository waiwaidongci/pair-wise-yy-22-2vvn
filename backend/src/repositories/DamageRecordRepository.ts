import { ledgerDatabase } from "../db/ledgerDatabase";
import type { DamageRecord } from "../models/DamageRecord";

export const damageRecordRepository = {
  findAll: (): DamageRecord[] => ledgerDatabase.list<DamageRecord>("damageRecord"),
  findById: (id: number): DamageRecord | undefined => ledgerDatabase.findById<DamageRecord>("damageRecord", id),
  save: (row: Partial<DamageRecord> & { id?: number }): DamageRecord =>
    ledgerDatabase.insert<DamageRecord>("damageRecord", row as DamageRecord),
  update: (id: number, patch: Partial<DamageRecord>): DamageRecord | undefined =>
    ledgerDatabase.update<DamageRecord>("damageRecord", id, patch)
};
