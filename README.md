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

## 材料批次领用链（可恢复）

修复方案、修复步骤、材料批次与影像版本已接成**可恢复的领用链**，解决「纸单领用、批次失效继续施工、审批与影像对不上」的问题。

### 核心实体

- **MaterialBatch（材料批次）**：批次号、材料名、规格、供应商、总量、余量、单位、效期、状态（ACTIVE/RECALLED/EXPIRED/DEPLETED）。
- **MaterialRequisition（领用记录）**：请求号（幂等键）、步骤、方案、批次、用量、领用人、状态（CONFIRMED/ROLLED_BACK）。
- **RestorationStep 扩展**：`material_batch_id`（批次版本）、`material_qty`、`requisition_status`、`ledger_version`（台账版本，用于并发冲突检测）。
- **RestorationPlan 扩展**：`ledger_version`、`recalc_status`（PENDING/RECALCULATED）、`archived_at`。
- **ImageVersion 扩展**：`step_id`、`requisition_id`（影像凭证关联领用链）。

### 业务规则

1. **提交领用**：修复师在步骤上提交批次和用量，服务端按剩余量扣减，按请求号幂等（重试不重复扣减）。
2. **批次失效退回**：批次被召回/过期/耗尽时，未完成步骤退回重算（释放批次版本、领用记录置为 ROLLED_BACK），并给出替代批次；已完成步骤和已归档方案保留原用量。
3. **并发冲突**：两名修复师同时提交同一步骤时，后到方携带的 `base_ledger_version` 与服务端不一致，返回 409 并要求重新选择批次。
4. **专家复算**：复算核对步骤批次版本、影像凭证与台账一致性；复算通过后方案才能审批通过。
5. **归档禁止领用**：档案员归档后，方案下所有步骤禁止再领用。
6. **离线草稿**：现场断网时领用先存草稿（localStorage，按步骤归一），回网后按步骤合并；冲突的步骤保留草稿并提示重新选择。
7. **补齐旧步骤**：旧步骤没有批次版本时，按当前台账补齐（分配批次并记录领用）。

### 主要接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/material-batch` | 材料批次列表 |
| POST | `/api/material-batch/:id/recall` | 召回批次（退回未完成步骤） |
| POST | `/api/material-batch/:id/expire` | 过期批次 |
| POST | `/api/material-batch/:id/deplete` | 耗尽批次 |
| GET | `/api/material-batch/alternatives` | 替代批次推荐 |
| POST | `/api/restoration-step/requisition` | 提交领用（幂等 + 冲突检测） |
| POST | `/api/restoration-step/backfill` | 补齐旧步骤批次版本 |
| POST | `/api/restoration-plan/:id/recalculate` | 专家复算 |
| POST | `/api/restoration-plan/:id/approve` | 审批通过（必须先复算） |
| POST | `/api/restoration-plan/:id/archive` | 档案员归档 |

### 前端离线草稿

- `hooks/useOfflineDraft.ts`：断网存草稿、回网按步骤合并。
- `components/requisition/RequisitionForm.tsx`：领用表单，断网自动切为草稿模式。
- `components/requisition/OfflineDraftBanner.tsx`：草稿横幅，一键合并。

## License

MIT
