import { damageRecordRepository } from "../repositories/DamageRecordRepository";

export const damageRecordService = {
  list: () => damageRecordRepository.findAll()
};
