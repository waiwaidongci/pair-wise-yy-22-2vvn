import { useEffect, useMemo, useState } from "react";
import { useRestorationPlanStore } from "../stores/RestorationPlanStore";
import { useRestorationStepStore } from "../stores/RestorationStepStore";
import { useMaterialBatchStore } from "../stores/MaterialBatchStore";
import { StatusBadge } from "../components/common/StatusBadge";
import { MaterialBatchBadge } from "../components/common/MaterialBatchBadge";
import { RequisitionStatusBadge } from "../components/common/RequisitionStatusBadge";
import { RequisitionForm } from "../components/requisition/RequisitionForm";
import { OfflineDraftBanner } from "../components/requisition/OfflineDraftBanner";
import { PlanApprovalStatusText } from "../constants/PlanApprovalStatus";
import { PlanRecalcStatusText } from "../constants/PlanRecalcStatus";
import type { RestorationPlan } from "../types/RestorationPlan";
import type { SubmitRequisitionResult } from "../types/MaterialRequisition";

export function PlansPage() {
  const { rows: plans, load: loadPlans, recalculate, approve, archive } = useRestorationPlanStore();
  const { rows: steps, load: loadSteps, backfill } = useRestorationStepStore();
  const { rows: batches, load: loadBatches } = useMaterialBatchStore();
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [requisitionStepId, setRequisitionStepId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
    loadSteps();
    loadBatches();
  }, [loadPlans, loadSteps, loadBatches]);

  const activePlan: RestorationPlan | undefined = useMemo(
    () => plans.find((plan) => plan.id === activePlanId),
    [plans, activePlanId]
  );
  const planSteps = useMemo(
    () => steps.filter((step) => step.plan_id === activePlanId),
    [steps, activePlanId]
  );

  const batchMap = useMemo(() => new Map(batches.map((batch) => [batch.id, batch])), [batches]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setError(null);
    setTimeout(() => setNotice(null), 4000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setNotice(null);
  };

  const handleRecalc = async (planId: number) => {
    try {
      const result = await recalculate(planId);
      if (result.ok) {
        showNotice("复算通过：台账与影像凭证一致");
      } else {
        showError("复算未通过：" + result.issues.map((issue) => issue.message).join("；"));
      }
    } catch (err) {
      showError((err as Error).message);
    }
  };

  const handleApprove = async (planId: number) => {
    try {
      await approve(planId);
      showNotice("方案已审批通过");
    } catch (err) {
      showError((err as Error).message);
    }
  };

  const handleArchive = async (planId: number) => {
    try {
      await archive(planId);
      showNotice("方案已归档，禁止再领用材料");
    } catch (err) {
      showError((err as Error).message);
    }
  };

  const handleBackfill = async () => {
    try {
      const count = await backfill();
      showNotice(`已补齐 ${count} 个步骤的批次版本`);
    } catch (err) {
      showError((err as Error).message);
    }
  };

  const handleSubmitted = (result: SubmitRequisitionResult) => {
    setRequisitionStepId(null);
    showNotice(
      result.idempotent
        ? "请求号已处理，未重复扣减（幂等）"
        : `领用成功：批次 ${result.batch.batch_no} 扣减 ${result.requisition.qty}`
    );
  };

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">修复方案</p>
          <h1>修复方案与材料领用链</h1>
        </div>
        <StatusBadge value="LEDGER" />
      </div>

      <OfflineDraftBanner />

      <div className="plans-layout">
        <div className="panel">
          <div className="panel-head">
            <h2>方案列表</h2>
            <button type="button" onClick={handleBackfill}>
              补齐旧步骤批次
            </button>
          </div>
          <div className="table">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={"row clickable" + (activePlanId === plan.id ? " active" : "")}
                onClick={() => {
                  setActivePlanId(plan.id);
                  setRequisitionStepId(null);
                }}
              >
                <strong>{plan.plan_title}</strong>
                <span className="muted">{plan.plan_title}</span>
                <StatusBadge value={plan.approval_status} />
                <span className="muted">
                  复算：
                  {PlanRecalcStatusText[plan.recalc_status as keyof typeof PlanRecalcStatusText] ??
                    plan.recalc_status}
                </span>
              </article>
            ))}
          </div>
        </div>

        <div className="panel wide">
          {!activePlan ? (
            <div className="empty">请选择一个方案查看步骤与领用</div>
          ) : (
            <>
              <div className="panel-head">
                <h2>{activePlan.plan_title} · 步骤领用</h2>
                <div className="btn-group">
                  <button type="button" onClick={() => handleRecalc(activePlan.id)}>
                    专家复算
                  </button>
                  <button type="button" className="primary" onClick={() => handleApprove(activePlan.id)}>
                    审批通过
                  </button>
                  <button type="button" onClick={() => handleArchive(activePlan.id)}>
                    归档
                  </button>
                </div>
              </div>

              <div className="muted plan-meta">
                审批状态：
                {PlanApprovalStatusText[activePlan.approval_status as keyof typeof PlanApprovalStatusText] ??
                  activePlan.approval_status}
                {" · "}复算状态：
                {PlanRecalcStatusText[activePlan.recalc_status as keyof typeof PlanRecalcStatusText] ??
                  activePlan.recalc_status}
                {activePlan.archived_at && " · 已归档"}
              </div>

              <div className="table">
                {planSteps.map((step) => {
                  const batch = step.material_batch_id ? batchMap.get(step.material_batch_id) : undefined;
                  const isArchived = activePlan.approval_status === "ARCHIVED";
                  const isCompleted = ["APPROVED", "COMPLETED", "FINISHED"].includes(step.step_status.toUpperCase());
                  return (
                    <article key={step.id} className="row step-row">
                      <div className="step-main">
                        <strong>
                          步骤 {step.id} · {step.technique}
                        </strong>
                        <span className="muted">{step.material_used}</span>
                        <div className="step-badges">
                          <StatusBadge value={step.step_status} />
                          <RequisitionStatusBadge status={step.requisition_status} />
                          {batch && <MaterialBatchBadge status={batch.status} />}
                        </div>
                        {batch ? (
                          <span className="muted">
                            批次 {batch.batch_no} · 用量 {step.material_qty} {batch.unit}
                          </span>
                        ) : (
                          <span className="muted">未领用材料</span>
                        )}
                      </div>
                      <div className="step-actions">
                        {!isArchived && !isCompleted && (
                          <button
                            type="button"
                            className="primary"
                            onClick={() => setRequisitionStepId(requisitionStepId === step.id ? null : step.id)}
                          >
                            {requisitionStepId === step.id ? "收起" : "领用材料"}
                          </button>
                        )}
                        {isArchived && <span className="muted">已归档，禁止领用</span>}
                        {isCompleted && <span className="muted">已完成，保留原用量</span>}
                      </div>
                      {requisitionStepId === step.id && (
                        <div className="step-requisition">
                          <RequisitionForm
                            step={step}
                            operatorId={step.operator_id}
                            onSubmitted={handleSubmitted}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}
    </section>
  );
}
