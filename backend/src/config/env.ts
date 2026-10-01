/**
 * 全局配置：分别经过 docker-compose.yml / .env / 本模块读取，
 * 新增配置必须同步多处。
 */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbHost: process.env.DB_HOST ?? "localhost",
  dbPort: Number(process.env.DB_PORT ?? 5432),
  jwtSecret: process.env.JWT_SECRET ?? "local-dev-secret",
  /** 可恢复领用链的落地台账文件（现场断网重传也以此为准）。 */
  storeFile: process.env.STORE_FILE ?? `${process.cwd()}/data/relic-store.json`
};
