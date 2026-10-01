import type { RelicItem } from "./RelicItem";
import type { DamageRecord } from "./DamageRecord";
import type { RestorationPlan } from "./RestorationPlan";
import type { RestorationStep } from "./RestorationStep";
import type { ImageVersion } from "./ImageVersion";
import type { MaterialBatch } from "./MaterialBatch";
import type { MaterialRequisition } from "./MaterialRequisition";
import type { AuditLogEntry } from "./AuditLogEntry";

/** 整库形状：jsonStore 与各 repository 只允许通过这里声明的集合访问数据。 */
export interface DatabaseShape {
  relicItem: RelicItem[];
  damageRecord: DamageRecord[];
  restorationPlan: RestorationPlan[];
  restorationStep: RestorationStep[];
  imageVersion: ImageVersion[];
  materialBatch: MaterialBatch[];
  materialRequisition: MaterialRequisition[];
  auditLog: AuditLogEntry[];
  sequences: Record<string, number>;
}
