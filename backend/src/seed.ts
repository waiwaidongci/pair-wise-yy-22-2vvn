import type { DatabaseShape } from "./models/DatabaseShape";

/**
 * 本地种子数据：全部来自本地数据库/台账，禁止接入第三方 API。
 * 场景覆盖：
 *  - 步骤1：旧步骤无批次版本（batch_id 为空），等待「按当前台账补齐」
 *  - 步骤2：正常待执行步骤，可提交批次用量
 *  - 步骤3：已完成步骤，原用量锁定，批次再失效也不冲回
 *  - 方案5：已归档，步骤4领用链冻结
 *  - 批次4 召回 / 批次5 过期 / 批次6 余量不足，批次7 是批次4 同材料的替代批次
 */
export function seedDatabase(): DatabaseShape {
  const now = "2026-09-30T09:00:00Z";
  return {
    relicItem: [
      { id: 1, relic_code: "RELIC-001", name: "青瓷莲花盏", era: "南朝", material: "青瓷", collection_level: "HIGH", storage_location: "修复室A-01", current_condition: "IN_RESTORATION" },
      { id: 2, relic_code: "RELIC-002", name: "鎏金铜佛造像", era: "唐", material: "铜鎏金", collection_level: "HIGH", storage_location: "修复室A-02", current_condition: "IN_RESTORATION" },
      { id: 3, relic_code: "RELIC-003", name: "绢本设色仕女图", era: "宋", material: "绢本", collection_level: "MEDIUM", storage_location: "书画修复室B-01", current_condition: "DAMAGED" },
      { id: 4, relic_code: "RELIC-004", name: "彩陶双耳罐", era: "马家窑", material: "彩陶", collection_level: "MEDIUM", storage_location: "归档库房C-11", current_condition: "SEALED" }
    ],
    damageRecord: [
      { id: 1, relic_id: 1, damage_type: "CRACK", position_desc: "盏腹纵向冲裂约 8cm", severity: "HIGH", discovered_by: "张馆员", discovered_at: "2026-09-20T09:00:00Z", image_url: "/mock/image_url-1.png", status: "APPROVED" },
      { id: 2, relic_id: 2, damage_type: "GILDING_LOSS", position_desc: "面部鎏金脱落 6 处", severity: "MEDIUM", discovered_by: "李馆员", discovered_at: "2026-09-18T09:00:00Z", image_url: "/mock/image_url-2.png", status: "APPROVED" },
      { id: 3, relic_id: 3, damage_type: "MILDEW", position_desc: "画心右下霉斑 12cm", severity: "CRITICAL", discovered_by: "王馆员", discovered_at: "2026-09-22T09:00:00Z", image_url: "/mock/image_url-3.png", status: "SUBMITTED" }
    ],
    restorationPlan: [
      { id: 1, relic_id: 1, damage_record_id: 1, plan_title: "青瓷冲裂粘接修复方案", method: "环氧树脂无痕粘接 + 随色作旧", risk_assessment: "粘接剂可逆性中等，需控量", approval_status: "APPROVED", owner_id: 1, material_rechecked: false, recalculated_total: null, ledger_total: null, archived_at: null, archived_by: null },
      { id: 2, relic_id: 2, damage_record_id: 2, plan_title: "鎏金面部补金方案", method: "传统金箔贴金 + 矿物颜料封护", risk_assessment: "贴金层须与原金层同批次应力", approval_status: "APPROVED", owner_id: 2, material_rechecked: false, recalculated_total: null, ledger_total: 80, archived_at: null, archived_by: null },
      { id: 3, relic_id: 3, damage_record_id: 3, plan_title: "绢本霉斑清洗方案", method: "缓释剂局部清洗", risk_assessment: "绢丝强度低，禁止大面积浸润", approval_status: "SUBMITTED", owner_id: 3, material_rechecked: false, recalculated_total: null, ledger_total: null, archived_at: null, archived_by: null },
      { id: 5, relic_id: 4, damage_record_id: 2, plan_title: "彩陶耳部加固归档方案", method: "环氧回填加固", risk_assessment: "已稳定，仅归档留存", approval_status: "ARCHIVED", owner_id: 2, material_rechecked: true, recalculated_total: 40, ledger_total: 40, archived_at: "2026-09-15T10:00:00Z", archived_by: 3 }
    ],
    restorationStep: [
      {
        id: 1, plan_id: 1, step_order: "1", technique: "裂缝清理对合", material_used: "无水乙醇（旧步骤，未登记批次）", operator_id: null, step_status: "PENDING", finished_at: null,
        execution_status: "PENDING", batch_id: null, batch_version_no: null, quantity_used: 0, image_version_id: null, lock_holder_id: null, lock_holder_name: null, base_version: 0, rework_reason: null, updated_at: now
      },
      {
        id: 2, plan_id: 1, step_order: "2", technique: "环氧树脂无痕粘接", material_used: "环氧树脂", operator_id: 1, step_status: "IN_PROGRESS", finished_at: null,
        execution_status: "PENDING", batch_id: 1, batch_version_no: 1, quantity_used: 0, image_version_id: 1, lock_holder_id: null, lock_holder_name: null, base_version: 1, rework_reason: null, updated_at: now
      },
      {
        id: 3, plan_id: 2, step_order: "1", technique: "面部贴金", material_used: "矿物颜料（封护）", operator_id: 2, step_status: "FINISHED", finished_at: "2026-09-28T16:00:00Z",
        execution_status: "FINISHED", batch_id: 3, batch_version_no: 1, quantity_used: 80, image_version_id: 2, lock_holder_id: null, lock_holder_name: null, base_version: 2, rework_reason: null, updated_at: "2026-09-28T16:00:00Z"
      },
      {
        id: 4, plan_id: 5, step_order: "1", technique: "耳部回填加固", material_used: "矿物颜料（封护）", operator_id: 2, step_status: "FINISHED", finished_at: "2026-09-14T15:00:00Z",
        execution_status: "FINISHED", batch_id: 3, batch_version_no: 1, quantity_used: 40, image_version_id: 5, lock_holder_id: null, lock_holder_name: null, base_version: 1, rework_reason: null, updated_at: "2026-09-14T15:00:00Z"
      }
    ],
    imageVersion: [
      { id: 1, relic_id: 1, plan_id: 1, step_id: 2, version_no: "V1", image_type: "PROCESS", file_path: "/images/relic-001/v1-crack-before.png", capture_at: "2026-09-29T10:00:00Z", note: "粘接前裂缝影像", archived: false },
      { id: 2, relic_id: 2, plan_id: 2, step_id: 3, version_no: "V1", image_type: "PROCESS", file_path: "/images/relic-002/v1-gilding.png", capture_at: "2026-09-28T15:30:00Z", note: "贴金过程影像", archived: false },
      { id: 3, relic_id: 3, plan_id: 3, step_id: null, version_no: "V1", image_type: "BEFORE", file_path: "/images/relic-003/v1-mildew.png", capture_at: "2026-09-22T11:00:00Z", note: "霉斑现状影像", archived: false },
      { id: 4, relic_id: 1, plan_id: 1, step_id: 1, version_no: "V1", image_type: "PROCESS", file_path: "/images/relic-001/v1-clean.png", capture_at: "2026-09-29T09:30:00Z", note: "裂缝清理影像", archived: false },
      { id: 5, relic_id: 4, plan_id: 5, step_id: 4, version_no: "V1", image_type: "AFTER", file_path: "/images/relic-004/v1-archived.png", capture_at: "2026-09-14T14:00:00Z", note: "归档前终态影像", archived: true }
    ],
    materialBatch: [
      { id: 1, batch_no: "EPOXY-2026-01", material_name: "环氧树脂", spec: "500g/罐", total_quantity: 1000, remaining_quantity: 1000, status: "ACTIVE", produced_at: "2026-08-01T00:00:00Z", expires_at: "2027-08-01T00:00:00Z", recalled_at: null, created_at: now, updated_at: now },
      { id: 2, batch_no: "GOLD-2026-03", material_name: "金箔", spec: "100张/册", total_quantity: 500, remaining_quantity: 500, status: "ACTIVE", produced_at: "2026-07-01T00:00:00Z", expires_at: "2029-07-01T00:00:00Z", recalled_at: null, created_at: now, updated_at: now },
      { id: 3, batch_no: "PIGMENT-2026-02", material_name: "矿物颜料", spec: "250g/盒", total_quantity: 300, remaining_quantity: 180, status: "ACTIVE", produced_at: "2026-06-01T00:00:00Z", expires_at: "2028-06-01T00:00:00Z", recalled_at: null, created_at: now, updated_at: now },
      { id: 4, batch_no: "EPOXY-2025-09", material_name: "环氧树脂", spec: "500g/罐", total_quantity: 800, remaining_quantity: 600, status: "RECALLED", produced_at: "2025-09-01T00:00:00Z", expires_at: "2027-09-01T00:00:00Z", recalled_at: "2026-09-27T08:00:00Z", created_at: "2025-09-01T00:00:00Z", updated_at: "2026-09-27T08:00:00Z" },
      { id: 5, batch_no: "ETHANOL-2025-01", material_name: "无水乙醇", spec: "500ml/瓶", total_quantity: 400, remaining_quantity: 400, status: "EXPIRED", produced_at: "2024-01-01T00:00:00Z", expires_at: "2026-05-01T00:00:00Z", recalled_at: null, created_at: "2024-01-01T00:00:00Z", updated_at: "2026-05-02T00:00:00Z" },
      { id: 6, batch_no: "PIGMENT-2026-06", material_name: "矿物颜料", spec: "250g/盒", total_quantity: 100, remaining_quantity: 30, status: "ACTIVE", produced_at: "2026-06-10T00:00:00Z", expires_at: "2028-06-10T00:00:00Z", recalled_at: null, created_at: now, updated_at: now },
      { id: 7, batch_no: "EPOXY-2026-08", material_name: "环氧树脂", spec: "500g/罐", total_quantity: 600, remaining_quantity: 600, status: "ACTIVE", produced_at: "2026-08-20T00:00:00Z", expires_at: "2027-08-20T00:00:00Z", recalled_at: null, created_at: now, updated_at: now }
    ],
    materialRequisition: [
      { id: 1, request_id: "seed-req-0001", step_id: 3, plan_id: 2, batch_id: 3, batch_version_no: 1, image_version_id: 2, operator_id: 2, quantity: 80, status: "CONSUMED", reversed_from_id: null, locked: false, submitted_at: "2026-09-28T15:45:00Z", finalized_at: "2026-09-28T16:00:00Z" },
      { id: 2, request_id: "seed-req-0002", step_id: 4, plan_id: 5, batch_id: 3, batch_version_no: 1, image_version_id: 5, operator_id: 2, quantity: 40, status: "LOCKED", reversed_from_id: null, locked: true, submitted_at: "2026-09-14T14:30:00Z", finalized_at: "2026-09-15T10:00:00Z" }
    ],
    auditLog: [],
    sequences: {
      relicItem: 4,
      damageRecord: 3,
      restorationPlan: 5,
      restorationStep: 4,
      imageVersion: 5,
      materialBatch: 7,
      materialRequisition: 2,
      auditLog: 0
    }
  };
}
