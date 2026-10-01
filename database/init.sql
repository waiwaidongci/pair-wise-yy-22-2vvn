-- 文物修复档案协作平台：可恢复材料领用链表结构（PostgreSQL 15）
-- 应用运行时以本地台账文件作为可恢复落地存储，本脚本提供等价关系模型，
-- 便于评审理解方案 -> 步骤 -> 批次领用单 -> 影像凭证 的外键链路。

CREATE TABLE IF NOT EXISTS relic_item (
  id INTEGER PRIMARY KEY,
  relic_code TEXT,
  name TEXT,
  era TEXT,
  material TEXT,
  collection_level TEXT,
  storage_location TEXT,
  current_condition TEXT
);

CREATE TABLE IF NOT EXISTS damage_record (
  id INTEGER PRIMARY KEY,
  relic_id INTEGER,
  damage_type TEXT,
  position_desc TEXT,
  severity TEXT,
  discovered_by TEXT,
  discovered_at TEXT,
  image_url TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS restoration_plan (
  id INTEGER PRIMARY KEY,
  relic_id INTEGER,
  damage_record_id INTEGER,
  plan_title TEXT,
  method TEXT,
  risk_assessment TEXT,
  approval_status TEXT,
  owner_id INTEGER,
  material_rechecked BOOLEAN DEFAULT FALSE,
  recalculated_total NUMERIC(14,3),
  ledger_total NUMERIC(14,3),
  archived_at TEXT,
  archived_by INTEGER
);

-- 材料批次台账：remaining_quantity 仅允许在领用事务内扣减/冲回
CREATE TABLE IF NOT EXISTS material_batch (
  id INTEGER PRIMARY KEY,
  batch_no TEXT UNIQUE,
  material_name TEXT,
  spec TEXT,
  total_quantity NUMERIC(14,3),
  remaining_quantity NUMERIC(14,3),
  status TEXT,                       -- ACTIVE / RECALLED / EXPIRED / DEPLETED
  produced_at TEXT,
  expires_at TEXT,
  recalled_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS image_version (
  id INTEGER PRIMARY KEY,
  relic_id INTEGER,
  plan_id INTEGER,
  step_id INTEGER,                   -- 非空时表示该版本是某步骤的影像凭证
  version_no TEXT,
  image_type TEXT,
  file_path TEXT,
  capture_at TEXT,
  note TEXT,
  archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS restoration_step (
  id INTEGER PRIMARY KEY,
  plan_id INTEGER,
  step_order TEXT,
  technique TEXT,
  material_used TEXT,
  operator_id INTEGER,
  step_status TEXT,
  finished_at TEXT,
  execution_status TEXT DEFAULT 'PENDING',   -- PENDING / REWORK_PENDING / FINISHED
  batch_id INTEGER,
  batch_version_no INTEGER,
  quantity_used NUMERIC(14,3) DEFAULT 0,
  image_version_id INTEGER,
  lock_holder_id INTEGER,
  lock_holder_name TEXT,
  base_version INTEGER DEFAULT 0,            -- 乐观版本，后到方据此重新选择
  rework_reason TEXT,
  updated_at TEXT
);

-- 材料领用单：request_id 幂等键；冲回单以 reversed_from_id 指向原单
CREATE TABLE IF NOT EXISTS material_requisition (
  id INTEGER PRIMARY KEY,
  request_id TEXT UNIQUE,
  step_id INTEGER,
  plan_id INTEGER,
  batch_id INTEGER,
  batch_version_no INTEGER,
  image_version_id INTEGER,
  operator_id INTEGER,
  quantity NUMERIC(14,3),
  status TEXT,                       -- CONSUMED / REVERSED / LOCKED
  reversed_from_id INTEGER,
  locked BOOLEAN DEFAULT FALSE,
  submitted_at TEXT,
  finalized_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  actor TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  detail TEXT,
  created_at TEXT
);

-- 幂等与并发的关键索引（与应用层 withTransaction 互斥事务对应）
CREATE INDEX IF NOT EXISTS idx_requisition_step ON material_requisition(step_id);
CREATE INDEX IF NOT EXISTS idx_requisition_plan ON material_requisition(plan_id);
CREATE INDEX IF NOT EXISTS idx_requisition_request ON material_requisition(request_id);
CREATE INDEX IF NOT EXISTS idx_step_plan ON restoration_step(plan_id);
CREATE INDEX IF NOT EXISTS idx_step_batch ON restoration_step(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_status ON material_batch(status);
