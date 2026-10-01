export const seed = {
  "relicItem": [
    {
      "id": 1,
      "relic_code": "relic code 1",
      "name": "name 1",
      "era": "era 1",
      "material": "material 1",
      "collection_level": "LOW",
      "storage_location": "storage location 1",
      "current_condition": "current condition 1"
    },
    {
      "id": 2,
      "relic_code": "relic code 2",
      "name": "name 2",
      "era": "era 2",
      "material": "material 2",
      "collection_level": "MEDIUM",
      "storage_location": "storage location 2",
      "current_condition": "current condition 2"
    },
    {
      "id": 3,
      "relic_code": "relic code 3",
      "name": "name 3",
      "era": "era 3",
      "material": "material 3",
      "collection_level": "HIGH",
      "storage_location": "storage location 3",
      "current_condition": "current condition 3"
    }
  ],
  "damageRecord": [
    {
      "id": 1,
      "relic_id": 1,
      "damage_type": "FRAGILE",
      "position_desc": "position desc 1",
      "severity": "severity 1",
      "discovered_by": "discovered by 1",
      "discovered_at": "2026-06-11T09:00:00Z",
      "image_url": "/mock/image_url-1.png",
      "status": "SUBMITTED"
    },
    {
      "id": 2,
      "relic_id": 2,
      "damage_type": "DAMAGED",
      "position_desc": "position desc 2",
      "severity": "severity 2",
      "discovered_by": "discovered by 2",
      "discovered_at": "2026-06-12T09:00:00Z",
      "image_url": "/mock/image_url-2.png",
      "status": "APPROVED"
    },
    {
      "id": 3,
      "relic_id": 3,
      "damage_type": "IN_RESTORATION",
      "position_desc": "position desc 3",
      "severity": "severity 3",
      "discovered_by": "discovered by 3",
      "discovered_at": "2026-06-13T09:00:00Z",
      "image_url": "/mock/image_url-3.png",
      "status": "DRAFT"
    }
  ],
  "restorationPlan": [
    {
      "id": 1,
      "relic_id": 1,
      "damage_record_id": 1,
      "plan_title": "plan title 1",
      "method": "method 1",
      "risk_assessment": "risk assessment 1",
      "approval_status": "SUBMITTED",
      "owner_id": 1,
      "ledger_version": 1,
      "recalc_status": "PENDING",
      "archived_at": null
    },
    {
      "id": 2,
      "relic_id": 2,
      "damage_record_id": 2,
      "plan_title": "plan title 2",
      "method": "method 2",
      "risk_assessment": "risk assessment 2",
      "approval_status": "APPROVED",
      "owner_id": 2,
      "ledger_version": 1,
      "recalc_status": "RECALCULATED",
      "archived_at": null
    },
    {
      "id": 3,
      "relic_id": 3,
      "damage_record_id": 3,
      "plan_title": "plan title 3",
      "method": "method 3",
      "risk_assessment": "risk assessment 3",
      "approval_status": "DRAFT",
      "owner_id": 3,
      "ledger_version": 1,
      "recalc_status": "PENDING",
      "archived_at": null
    }
  ],
  "restorationStep": [
    {
      "id": 1,
      "plan_id": 1,
      "step_order": "step order 1",
      "technique": "technique 1",
      "material_used": "material used 1",
      "operator_id": 1,
      "step_status": "SUBMITTED",
      "finished_at": "2026-06-11T09:00:00Z",
      "material_batch_id": 1,
      "material_qty": 5,
      "requisition_status": "CONFIRMED",
      "ledger_version": 1
    },
    {
      "id": 2,
      "plan_id": 2,
      "step_order": "step order 2",
      "technique": "technique 2",
      "material_used": "material used 2",
      "operator_id": 2,
      "step_status": "APPROVED",
      "finished_at": "2026-06-12T09:00:00Z",
      "material_batch_id": 2,
      "material_qty": 3,
      "requisition_status": "CONFIRMED",
      "ledger_version": 1
    },
    {
      "id": 3,
      "plan_id": 3,
      "step_order": "step order 3",
      "technique": "technique 3",
      "material_used": "material used 3",
      "operator_id": 3,
      "step_status": "DRAFT",
      "finished_at": "2026-06-13T09:00:00Z",
      "material_batch_id": null,
      "material_qty": 0,
      "requisition_status": "NONE",
      "ledger_version": 1
    },
    {
      "id": 4,
      "plan_id": 1,
      "step_order": "step order 4",
      "technique": "technique 4",
      "material_used": "material used 4",
      "operator_id": 1,
      "step_status": "SUBMITTED",
      "finished_at": "2026-06-11T10:00:00Z",
      "material_batch_id": 6,
      "material_qty": 7,
      "requisition_status": "CONFIRMED",
      "ledger_version": 1
    }
  ],
  "imageVersion": [
    {
      "id": 1,
      "relic_id": 1,
      "plan_id": 1,
      "version_no": "version no 1",
      "image_type": "FRAGILE",
      "file_path": "file path 1",
      "capture_at": "2026-06-11T09:00:00Z",
      "note": "note 1",
      "step_id": 1,
      "requisition_id": 1
    },
    {
      "id": 2,
      "relic_id": 2,
      "plan_id": 2,
      "version_no": "version no 2",
      "image_type": "DAMAGED",
      "file_path": "file path 2",
      "capture_at": "2026-06-12T09:00:00Z",
      "note": "note 2",
      "step_id": 2,
      "requisition_id": 2
    },
    {
      "id": 3,
      "relic_id": 3,
      "plan_id": 3,
      "version_no": "version no 3",
      "image_type": "IN_RESTORATION",
      "file_path": "file path 3",
      "capture_at": "2026-06-13T09:00:00Z",
      "note": "note 3",
      "step_id": null,
      "requisition_id": null
    },
    {
      "id": 4,
      "relic_id": 1,
      "plan_id": 1,
      "version_no": "version no 4",
      "image_type": "BEFORE_RESTORATION",
      "file_path": "file path 4",
      "capture_at": "2026-06-11T10:05:00Z",
      "note": "领用影像凭证",
      "step_id": 4,
      "requisition_id": 3
    }
  ],
  "materialBatch": [
    {
      "id": 1,
      "batch_no": "BATCH-2026-001",
      "material_name": "修复用棉纸",
      "spec": "30cm×30cm",
      "supplier": "供应商 A",
      "total_qty": 100,
      "remaining_qty": 95,
      "unit": "张",
      "expiry_date": "2027-01-01",
      "status": "ACTIVE",
      "received_at": "2026-01-10T09:00:00Z"
    },
    {
      "id": 2,
      "batch_no": "BATCH-2026-002",
      "material_name": "修复用糨糊",
      "spec": "500g/瓶",
      "supplier": "供应商 B",
      "total_qty": 50,
      "remaining_qty": 47,
      "unit": "瓶",
      "expiry_date": "2027-06-01",
      "status": "ACTIVE",
      "received_at": "2026-02-15T09:00:00Z"
    },
    {
      "id": 3,
      "batch_no": "BATCH-2026-003",
      "material_name": "矿物颜料",
      "spec": "100g/盒",
      "supplier": "供应商 C",
      "total_qty": 20,
      "remaining_qty": 20,
      "unit": "盒",
      "expiry_date": "2026-12-01",
      "status": "ACTIVE",
      "received_at": "2026-03-01T09:00:00Z"
    },
    {
      "id": 4,
      "batch_no": "BATCH-2026-004",
      "material_name": "修复用绢布",
      "spec": "1m×1m",
      "supplier": "供应商 D",
      "total_qty": 80,
      "remaining_qty": 80,
      "unit": "匹",
      "expiry_date": "2027-03-01",
      "status": "RECALLED",
      "received_at": "2026-01-20T09:00:00Z"
    },
    {
      "id": 5,
      "batch_no": "BATCH-2025-009",
      "material_name": "旧版黏合剂",
      "spec": "200g/罐",
      "supplier": "供应商 E",
      "total_qty": 40,
      "remaining_qty": 40,
      "unit": "罐",
      "expiry_date": "2025-01-01",
      "status": "EXPIRED",
      "received_at": "2024-12-01T09:00:00Z"
    },
    {
      "id": 6,
      "batch_no": "BATCH-2026-006",
      "material_name": "修复用宣纸",
      "spec": "40cm×40cm",
      "supplier": "供应商 F",
      "total_qty": 10,
      "remaining_qty": 3,
      "unit": "刀",
      "expiry_date": "2027-12-01",
      "status": "ACTIVE",
      "received_at": "2026-04-01T09:00:00Z"
    }
  ],
  "materialRequisition": [
    {
      "id": 1,
      "request_no": "REQ-SEED-0001",
      "step_id": 1,
      "plan_id": 1,
      "batch_id": 1,
      "qty": 5,
      "operator_id": 1,
      "status": "CONFIRMED",
      "created_at": "2026-06-11T09:05:00Z",
      "updated_at": "2026-06-11T09:05:00Z"
    },
    {
      "id": 2,
      "request_no": "REQ-SEED-0002",
      "step_id": 2,
      "plan_id": 2,
      "batch_id": 2,
      "qty": 3,
      "operator_id": 2,
      "status": "CONFIRMED",
      "created_at": "2026-06-12T09:05:00Z",
      "updated_at": "2026-06-12T09:05:00Z"
    },
    {
      "id": 3,
      "request_no": "REQ-SEED-0003",
      "step_id": 4,
      "plan_id": 1,
      "batch_id": 6,
      "qty": 7,
      "operator_id": 1,
      "status": "CONFIRMED",
      "created_at": "2026-06-11T10:05:00Z",
      "updated_at": "2026-06-11T10:05:00Z"
    }
  ]
} as const;
