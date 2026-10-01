import { useEffect, useMemo } from "react";
import { useRestorationPlanStore } from "../stores/RestorationPlanStore";
import { useRestorationStepStore } from "../stores/RestorationStepStore";
import { useMaterialBatchStore } from "../stores/MaterialBatchStore";
import { useMaterialRequisitionStore } from "../stores/MaterialRequisitionStore";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { MaterialBatchBadge } from "../components/common/MaterialBatchBadge";
import { RequisitionStatusBadge } from "../components/common/RequisitionStatusBadge";
import { PlanApprovalStatusText } from "../constants/PlanApprovalStatus";
import { PlanRecalcStatusText } from "../constants/PlanRecalcStatus";

export function DashboardPage() {
  const { rows: plans, load: loadPlans } = useRestorationPlanStore();
  const { rows: steps, load: loadSteps } = useRestorationStepStore();
  const { rows: batches, load: loadBatches } = useMaterialBatchStore();
  const { rows: requisitions, load: loadRequisitions } = useMaterialRequisitionStore();

  useEffect(() => {
    loadPlans();
    loadSteps();
    loadBatches();
    loadRequisitions();
  }, [loadPlans, loadSteps, loadBatches, loadRequisitions]);

  const pendingRecalc = useMemo(
    () => plans.filter((plan) => plan.recalc_status !== "RECALCULATED" && plan.approval_status !== "ARCHIVED"),
    [plans]
  );
  const lowStock = useMemo(
    () => batches.filter((batch) => batch.status === "ACTIVE" && batch.remaining_qty <= 10),
    [batches]
  );
  const invalidBatches = useMemo(
    () => batches.filter((batch) => batch.status === "RECALLED" || batch.status === "EXPIRED"),
    [batches]
  );
  const rolledBack = useMemo(
    () => requisitions.filter((req) => req.status === "ROLLED_BACK"),
    [requisitions]
  );

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">修复工作台</p>
          <h1>修复工作台</h1>
        </div>
        <StatusBadge value="LEDGER" />
      </div>

      <section className="metrics">
        <StatCard label="修复方案" value={plans.length} />
        <StatCard label="修复步骤" value={steps.length} />
        <StatCard label="材料批次" value={batches.length} />
        <StatCard label="领用记录" value={requisitions.length} />
        <StatCard label="待复算方案" value={pendingRecalc.length} />
        <StatCard label="低库存批次" value={lowStock.length} />
      </section>

      <section className="workbench">
        <div className="panel">
          <h2>待复算方案</h2>
          <div className="table">
            {pendingRecalc.length === 0 && <div className="empty">暂无待复算方案</div>}
            {pendingRecalc.map((plan) => (
              <article key={plan.id} className="row">
                <strong>{plan.plan_title}</strong>
                <StatusBadge value={plan.approval_status} />
                <span className="muted">
                  {PlanRecalcStatusText[plan.recalc_status as keyof typeof PlanRecalcStatusText] ??
                    plan.recalc_status}
                </span>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>低库存 / 失效批次</h2>
          <div className="table">
            {lowStock.length === 0 && invalidBatches.length === 0 && (
              <div className="empty">批次状态良好</div>
            )}
            {lowStock.map((batch) => (
              <article key={batch.id} className="row">
                <strong>{batch.batch_no}</strong>
                <span className="muted">
                  余量 {batch.remaining_qty}/{batch.total_qty} {batch.unit}
                </span>
                <MaterialBatchBadge status={batch.status} />
              </article>
            ))}
            {invalidBatches.map((batch) => (
              <article key={batch.id} className="row">
                <strong>{batch.batch_no}</strong>
                <span className="muted">{batch.material_name}</span>
                <MaterialBatchBadge status={batch.status} />
              </article>
            ))}
          </div>
        </div>

        <div className="panel wide">
          <h2>最近领用</h2>
          <div className="table">
            {requisitions.length === 0 && <div className="empty">暂无领用记录</div>}
            {requisitions.slice(0, 8).map((req) => {
              const batch = batches.find((b) => b.id === req.batch_id);
              return (
                <article key={req.id} className="row">
                  <strong>{req.request_no}</strong>
                  <span className="muted">
                    步骤 {req.step_id} · {batch?.batch_no ?? "-"} · {req.qty}
                  </span>
                  <RequisitionStatusBadge status={req.status} />
                </article>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h2>联动说明</h2>
          <p className="muted">
            修复方案、步骤、材料批次与影像版本已接成可恢复的领用链：批次失效会退回未完成步骤并推荐替代批次，
            专家复算通过后才能审批，归档后禁止领用。
          </p>
          {rolledBack.length > 0 && (
            <p className="muted">已有 {rolledBack.length} 条领用因批次失效被退回重算。</p>
          )}
        </div>
      </section>
    </section>
  );
}
