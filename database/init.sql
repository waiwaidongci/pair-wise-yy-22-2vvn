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
  relic_id TEXT,
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
  relic_id TEXT,
  damage_record_id TEXT,
  plan_title TEXT,
  method TEXT,
  risk_assessment TEXT,
  approval_status TEXT,
  owner_id TEXT,
  ledger_version INTEGER DEFAULT 1,
  recalc_status TEXT DEFAULT 'PENDING',
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS restoration_step (
  id INTEGER PRIMARY KEY,
  plan_id TEXT,
  step_order TEXT,
  technique TEXT,
  material_used TEXT,
  operator_id TEXT,
  step_status TEXT,
  finished_at TEXT,
  material_batch_id INTEGER,
  material_qty INTEGER DEFAULT 0,
  requisition_status TEXT DEFAULT 'NONE',
  ledger_version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS image_version (
  id INTEGER PRIMARY KEY,
  relic_id TEXT,
  plan_id TEXT,
  version_no TEXT,
  image_type TEXT,
  file_path TEXT,
  capture_at TEXT,
  note TEXT,
  step_id INTEGER,
  requisition_id INTEGER
);

CREATE TABLE IF NOT EXISTS material_batch (
  id INTEGER PRIMARY KEY,
  batch_no TEXT,
  material_name TEXT,
  spec TEXT,
  supplier TEXT,
  total_qty INTEGER,
  remaining_qty INTEGER,
  unit TEXT,
  expiry_date TEXT,
  status TEXT DEFAULT 'ACTIVE',
  received_at TEXT
);

CREATE TABLE IF NOT EXISTS material_requisition (
  id INTEGER PRIMARY KEY,
  request_no TEXT UNIQUE,
  step_id INTEGER,
  plan_id INTEGER,
  batch_id INTEGER,
  qty INTEGER,
  operator_id INTEGER,
  status TEXT DEFAULT 'CONFIRMED',
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  actor TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  created_at TEXT
);
