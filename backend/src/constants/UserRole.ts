/**
 * 平台 RBAC 角色。
 * RESTORER 修复师：执行步骤、提交批次用量、现场暂存草稿
 * EXPERT   专家：复算实际用量后通过/退回方案
 * ARCHIVIST 档案员：归档方案，归档后链路冻结
 * VISITOR  访客：只读
 */
export const UserRole = [
  "RESTORER",
  "EXPERT",
  "ARCHIVIST",
  "VISITOR"
] as const;
export type UserRole = (typeof UserRole)[number];

export const ROLE_LABEL: Record<UserRole, string> = {
  RESTORER: "修复师",
  EXPERT: "专家",
  ARCHIVIST: "档案员",
  VISITOR: "访客"
};
