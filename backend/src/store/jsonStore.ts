import { promises as fs } from "fs";
import path from "path";
import { config } from "../config/env";
import { seedDatabase } from "../seed";
import type { DatabaseShape } from "../models/DatabaseShape";

/**
 * 轻量持久化存储引擎：整库读写一份 JSON 文件，用进程内互斥队列串行化写事务。
 * 该服务定位为本地数据库（PostgreSQL）之外的可恢复落地存储：
 *  - 每次写事务在临界区内完成「读-改-写」，杜绝并发扣减超卖；
 *  - 写盘失败不污染内存状态，下一次读会回落到种子数据；
 *  - 幂等键台账、批次剩余量、步骤执行锁等一致性语义全部建立在 withTransaction 之上。
 */

let cache: DatabaseShape | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function ensureLoaded(): Promise<DatabaseShape> {
  if (cache) return cache;
  try {
    await fs.mkdir(path.dirname(config.storeFile), { recursive: true });
    const raw = await fs.readFile(config.storeFile, "utf8");
    cache = JSON.parse(raw) as DatabaseShape;
  } catch {
    cache = seedDatabase();
    await persist(cache);
  }
  return cache;
}

async function persist(db: DatabaseShape): Promise<void> {
  const tmp = `${config.storeFile}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, config.storeFile);
}

/**
 * 在互斥临界区内执行一次事务：
 * worker 直接修改传入的可变 draft，返回值会原样回传给调用方；
 * worker 抛错则跳过落盘，保证「要么整笔生效、要么完全不生效」。
 */
export async function withTransaction<T>(
  worker: (draft: DatabaseShape) => T | Promise<T>
): Promise<T> {
  const run = writeChain.then(async () => {
    const db = await ensureLoaded();
    const draft = clone(db);
    const result = await worker(draft);
    await persist(draft);
    cache = draft;
    return result;
  });
  // 无论上一笔成功与否，队列都要继续推进。
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/** 只读快照，不参与写互斥（读出来的是深拷贝，调用方无法篡改库内状态）。 */
export async function readSnapshot(): Promise<DatabaseShape> {
  const db = await ensureLoaded();
  return clone(db);
}

/** 测试/运维用：丢弃落盘数据，重新以种子数据初始化。 */
export async function resetDatabase(): Promise<void> {
  await withTransaction((draft) => {
    const fresh = seedDatabase();
    for (const key of Object.keys(draft) as (keyof DatabaseShape)[]) {
      delete draft[key];
    }
    Object.assign(draft, fresh);
  });
}
