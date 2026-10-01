# 文物修复档案协作平台

面向博物馆修复团队的文物病害记录、修复方案、影像版本和审批归档平台。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20110>

后端健康检查：<http://localhost:21110/health>


## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。


## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Ant Design + Zustand |
| 后端 | NestJS + TypeScript + Prisma |
| 数据库 | PostgreSQL 15 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `relic-restore`
- `FRONTEND_PORT`: 前端端口，默认 `20110`
- `BACKEND_PORT`: 后端端口，默认 `21110`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: relic-restore`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-relic-restore}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- RelicCondition: constants/RelicCondition、types/RelicCondition、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- PlanApprovalStatus: constants/PlanApprovalStatus、types/PlanApprovalStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- DamageSeverity: constants/DamageSeverity、types/DamageSeverity、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

---

## 可恢复材料领用链（修复方案 × 修复步骤 × 材料批次 × 影像版本）

修复步骤进入执行后不再依赖纸单。修复师在步骤上提交「批次 + 用量 + 影像凭证」，服务端在一个事务内完成校验、按剩余量扣减、按 `request_id` 幂等落账，并把方案、步骤、批次、影像版本串成一条可追溯、可退回、可恢复的领用链。

### 核心规则

1. **服务端按剩余量扣减 + 请求号幂等**：`POST /api/material-requisition` 在 `withTransaction` 临界区内「读批次余量 → 校验 → 扣减 → 写领用单 → 回写步骤」，同一 `request_id` 无论重传多少次只扣一次（幂等重放返回 `idempotent:true`）。并发实测：同请求号 10 并发只扣 1 笔；不同请求号抢同一步骤仅 1 笔成功，无超卖。
2. **批次失效级联退回**：批次被**召回/过期**时，引用它的**未完成步骤**退回 `REWORK_PENDING`（待重算），已扣余量按冲回单（负数 `REVERSED`）退回台账，并返回同材料的**替代批次**；**已完成步骤保留原用量**，**已归档方案**整条冻结不动。
3. **余量不足/过期拒绝继续**：`BATCH_INSUFFICIENT`、`BATCH_INVALID` 直接 422，步骤无法越过失效批次继续。
4. **影像凭证强一致**：领用/完成引用的 `image_version_id` 必须 `step_id` 相同，否则 `STEP_IMAGE_MISMATCH`，专家复算时审批与凭证天然对得上。
5. **专家复算后才能通过**：`POST /api/restoration-plan/:id/recalculate` 要求专家复算总量等于服务端台账实际用量（`ledger_total`），不一致 `PLAN_RECALC_MISMATCH`。
6. **档案员归档即冻结**：`POST /api/restoration-plan/:id/archive`（须先复算且步骤全部完成）把方案置 `ARCHIVED`、领用单置 `LOCKED`，此后任何领用返回 `ARCHIVE_FROZEN`。
7. **两人同步骤并发**：执行锁 + 步骤乐观版本（`base_version`）双重防护，后到方收到 `STEP_LOCKED_BY_PEER` / `STEP_EXECUTION_CONFLICT`，必须重新选择批次。
8. **断网草稿 / 回网合并**：断网时前端把用量写入 localStorage（按步骤分组，同步骤只留最新一版），浏览器回网后一键「按步骤合并同步」；冲突草稿标记 `CONFLICT` 并提示重新选择，绝不静默覆盖。
9. **旧步骤补齐**：没有批次版本的历史步骤通过 `POST /api/material-requisition/steps/:id/backfill` 按当前合格台账补齐。

### 新增 API

| 方法 | 路径 | 角色 | 说明 |
|---|---|---|---|
| POST | `/api/material-requisition` | 修复师 | 提交批次用量（`request_id` 幂等） |
| POST | `/api/material-requisition/steps/:id/backfill` | 修复师 | 旧步骤按当前台账补齐批次 |
| GET | `/api/material-requisition/plan/:id` | 专家 | 方案领用链台账（复算核对） |
| GET/POST | `/api/material-batch` | 修复师/管理 | 批次台账查询/入库 |
| POST | `/api/material-batch/:id/replenish` | 管理 | 批次补货 |
| POST | `/api/material-batch/:id/recall` `/expire` | 管理 | 召回/过期，级联退回未完成步骤并给替代批次 |
| POST | `/api/restoration-step/:id/lock` `/unlock` `/finish` | 修复师 | 执行锁、完成质检（须影像凭证） |
| POST | `/api/restoration-plan/:id/submit` `/recalculate` `/reject` `/archive` | 修复师/专家/档案员 | 提交、复算通过、退回、归档冻结 |

角色通过 JWT（`Authorization: Bearer`）或本地联调头 `x-role` / `x-operator-id` 传递。

### 新增实体与枚举

- 实体：`material_batch`（批次台账）、`material_requisition`（领用单/冲回单/锁定单），见 `database/init.sql` 与 `backend/src/models/`。
- `StepExecutionStatus`：PENDING / REWORK_PENDING / FINISHED
- `MaterialBatchStatus`：ACTIVE / RECALLED / EXPIRED / DEPLETED
- `RequisitionStatus`：CONSUMED / REVERSED / LOCKED
- `UserRole`：RESTORER / EXPERT / ARCHIVIST / VISITOR

枚举出现位置（前后端对称新增）：

- `StepExecutionStatus`：`backend/src/constants/StepExecutionStatus.ts`、`backend/src/models/RestorationStep.ts`、领用/步骤 service；前端 `constants/StepExecutionStatus.ts`、`types/RestorationStep.ts`、`components/common/StepStatusBadge.tsx`、工作台步骤卡、错误文案。
- `MaterialBatchStatus`：`backend/src/constants/MaterialBatchStatus.ts`、`models/MaterialBatch.ts`、批次/领用 service 与错误码；前端 `constants/MaterialBatchStatus.ts`、`types/MaterialBatch.ts`、`components/common/BatchStatusBadge.tsx`、批次台账面板、领用表单。
- `RequisitionStatus`：`backend/src/constants/RequisitionStatus.ts`、`models/MaterialRequisition.ts`、领用/归档 service；前端 `constants/RequisitionStatus.ts`、`types/MaterialRequisition.ts`。

### 落地存储与可恢复性

- 后端用 `backend/src/store/jsonStore.ts` 的互斥事务把整库落到 `STORE_FILE`（默认 `backend/data/relic-store.json`，容器内挂命名卷 `ledger_data:/data`）。每次写事务在临界区「读-改-写 + 临时文件 rename」，既保证并发扣减不超卖，也保证重启后台账、幂等键、步骤版本不丢失。
- 前端断网草稿存 localStorage（键 `relic-restore:requisition-drafts:v1`），回网后由 `RequisitionStore.syncDrafts` 按步骤合并。

### 前端工作台

「修复方案」导航（`/plans`，`frontend/src/pages/PlansPage.tsx`）提供：步骤领用表单（批次下拉只列合格在库、影像下拉只列本步骤凭证）、离线草稿条与冲突提示、专家复算面板（拉台账→回填复算→通过→归档）、批次台账面板（补货/召回/过期并即时看到步骤退回重算）。

## License

MIT
