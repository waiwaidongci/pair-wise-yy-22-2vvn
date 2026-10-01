import { seed } from "../seed";

/**
 * 可恢复领用链的内存台账。
 *
 * 仓库层不再直接返回静态 seed，而是读写本模块的可变状态，
 * 这样批次扣减、领用回滚、复算和归档才能在进程内真正生效。
 * 种子数据在首次加载时深拷贝，避免污染原始 seed。
 */

export type CollectionKey =
  | "relicItem"
  | "damageRecord"
  | "restorationPlan"
  | "restorationStep"
  | "imageVersion"
  | "materialBatch"
  | "materialRequisition";

type Row = Record<string, unknown>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const tables: Record<CollectionKey, Row[]> = {
  relicItem: clone(seed.relicItem) as unknown as Row[],
  damageRecord: clone(seed.damageRecord) as unknown as Row[],
  restorationPlan: clone(seed.restorationPlan) as unknown as Row[],
  restorationStep: clone(seed.restorationStep) as unknown as Row[],
  imageVersion: clone(seed.imageVersion) as unknown as Row[],
  materialBatch: clone(seed.materialBatch) as unknown as Row[],
  materialRequisition: clone(seed.materialRequisition) as unknown as Row[]
};

const nextSeedId = (rows: readonly { id: number }[]): number =>
  rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

const sequences: Record<CollectionKey, number> = {
  relicItem: nextSeedId(seed.relicItem),
  damageRecord: nextSeedId(seed.damageRecord),
  restorationPlan: nextSeedId(seed.restorationPlan),
  restorationStep: nextSeedId(seed.restorationStep),
  imageVersion: nextSeedId(seed.imageVersion),
  materialBatch: nextSeedId(seed.materialBatch),
  materialRequisition: nextSeedId(seed.materialRequisition)
};

export const ledgerDatabase = {
  list<T extends object = Row>(key: CollectionKey): T[] {
    return tables[key] as T[];
  },

  findById<T extends object = Row>(key: CollectionKey, id: number): T | undefined {
    return tables[key].find((row) => Number(row.id) === id) as T | undefined;
  },

  findOne<T extends object = Row>(key: CollectionKey, predicate: (row: T) => boolean): T | undefined {
    return (tables[key] as T[]).find(predicate);
  },

  findAll<T extends object = Row>(key: CollectionKey, predicate: (row: T) => boolean): T[] {
    return (tables[key] as T[]).filter(predicate);
  },

  insert<T extends object = Row>(key: CollectionKey, row: Partial<T> & { id?: number }): T {
    const id = row.id ?? sequences[key]++;
    const created = { ...(row as Row), id } as unknown as T;
    tables[key].push(created as unknown as Row);
    return created;
  },

  update<T extends object = Row>(key: CollectionKey, id: number, patch: Partial<T>): T | undefined {
    const index = tables[key].findIndex((row) => Number(row.id) === id);
    if (index < 0) return undefined;
    const updated = { ...tables[key][index], ...(patch as Row) } as unknown as T;
    tables[key][index] = updated as unknown as Row;
    return updated;
  },

  /** 仅供测试/重置使用：把某张表恢复成种子数据。 */
  reset(key?: CollectionKey): void {
    const keys: CollectionKey[] = key ? [key] : (Object.keys(tables) as CollectionKey[]);
    for (const k of keys) {
      (tables[k] as Row[]) = clone(seed[k]) as unknown as Row[];
      sequences[k] = nextSeedId(seed[k] as readonly { id: number }[]);
    }
  }
};
