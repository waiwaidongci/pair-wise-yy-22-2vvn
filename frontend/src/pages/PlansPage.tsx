import { useEffect, useMemo, useState } from "react";
import { useRestorationPlanStore } from "../stores/RestorationPlanStore";
import { useRestorationStepStore } from "../stores/RestorationStepStore";
import { useMaterialBatchStore } from "../stores/MaterialBatchStore";
import { useRequisitionStore } from "../stores/RequisitionStore";
import { listImageVersion } from "../api/ImageVersion";
import type { ImageVersion } from "../types/ImageVersion";
import { StepStatusBadge } from "../components/common/StepStatusBadge";
import { BatchStatusBadge } from "../components/common/BatchStatusBadge";
import { RequisitionForm } from "../components/common/RequisitionForm";
import { OfflineDraftBar } from "../components/common/OfflineDraftBar";
import { ExpertApprovalPanel } from "../components/common/ExpertApprovalPanel";

/**
 * 修复方案 · 可恢复材料领用链工作台。
 * 串联：修复方案 -> 修复步骤 -> 材料批次领用单 -> 影像凭证。
 */
export function PlansPage() {
  const plans = useRestorationPlanStore((s) => s.rows);
  const loadPlans = useRestorationPlanStore((s) => s.load);
  const noticePlan = useRestorationPlanStore((s) => s.notice);

  const steps = useRestorationStepStore((s) => s.rows);
  const loadSteps = useRestorationStepStore((s) => s.load);
  const finish = useRestorationStepStore((s) => s.finish);
  const noticeStep = useRestorationStepStore((s) => s.notice);

  const batches = useMaterialBatchStore((s) => s.rows);
  const loadBatches = useMaterialBatchStore((s) => s.load);
  const recall = useMaterialBatchStore((s) => s.recall);
  const expire = useMaterialBatchStore((s) => s.expire);
  const replenish = useMaterialBatchStore((s) => s.replenish);
  const noticeBatch = useMaterialBatchStore((s) => s.notice);

  const drafts = useRequisitionStore((s) => s.drafts);
  const noticeReq = useRequisitionStore((s) => s.notice);
  const backfill = useRequisitionStore((s) => s.backfill);
  const refreshDrafts = useRequisitionStore((s) => s.refreshDrafts);

  const [images, setImages] = useState<ImageVersion[]>([]);
  const [operatorId] = useState(1);
  const [operatorName] = useState("赵修复");
  const [planFilter, setPlanFilter] = useState<number>(0);

  useEffect(() => {
    void loadPlans();
    void loadSteps();
    void loadBatches();
    void listImageVersion().then(setImages).catch(() => setImages([]));
    refreshDrafts();
  }, [loadPlans, loadSteps, loadBatches, refreshDrafts]);

  // 批次处置后刷新步骤（召回/过期会让未完成步骤退回重算）。
  const refreshAll = () => {
    void loadSteps();
    void loadBatches();
    void loadPlans();
  };

  const visiblePlans = useMemo(
    () => (planFilter ? plans.filter((p) => p.id === planFilter) : plans),
    [plans, planFilter]
  );
  const notice = noticePlan ?? noticeStep ?? noticeBatch ?? noticeReq;

  return (
    <section className="chain-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">relic-restore · 材料领用链</p>
          <h1>修复方案与批次领用</h1>
          <p className="sub">方案 → 步骤 → 批次用量（幂等扣减）→ 影像凭证，断网可暂存、回网可合并、批次失效可退回重算。</p>
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(Number(e.target.value))}>
          <option value={0}>全部方案</option>
          {plans.map((p) => <option key={p.id} value={p.id}>方案 {p.id}｜{p.plan_title}</option>)}
        </select>
      </div>

      <OfflineDraftBar />
      {notice && <div className="notice">{notice}</div>}

      {drafts.some((d) => d.sync_state === "CONFLICT") && (
        <div className="conflict-summary">
          有 {drafts.filter((d) => d.sync_state === "CONFLICT").length} 条草稿因并发/批次失效需重新选择批次：
          {drafts.filter((d) => d.sync_state === "CONFLICT").map((d) => (
            <span key={d.draft_id} className="conflict-chip">步骤 {d.step_id}：{d.conflict_message}</span>
          ))}
        </div>
      )}

      <div className="chain-grid">
        <div className="panel wide">
          <h2>修复步骤与领用</h2>
          {visiblePlans.map((plan) => {
            const planSteps = steps.filter((s) => s.plan_id === plan.id);
            const planArchived = plan.approval_status === "ARCHIVED";
            return (
              <article key={plan.id} className={`plan-block ${planArchived ? "archived" : ""}`}>
                <header className="plan-head">
                  <div>
                    <strong>方案 {plan.id}｜{plan.plan_title}</strong>
                    <span className="badge">{plan.approval_status}</span>
                    {planArchived && <span className="badge batch-depleted">已归档冻结</span>}
                  </div>
                  <ExpertApprovalPanel plan={plan} />
                </header>

                {planSteps.map((step) => {
                  const batch = batches.find((b) => b.id === step.batch_id);
                  const stepImages = images.filter((img) => img.step_id === step.id);
                  const draft = drafts.find((d) => d.step_id === step.id);
                  const isOldStep = step.batch_id === null && step.execution_status !== "FINISHED";
                  return (
                    <div key={step.id} className="step-card">
                      <div className="step-meta">
                        <span className="step-no">#{step.step_order}</span>
                        <strong>{step.technique}</strong>
                        <StepStatusBadge value={step.execution_status} />
                        {step.lock_holder_id !== null && step.lock_holder_id !== operatorId && (
                          <span className="badge step-rework">执行锁：{step.lock_holder_name}</span>
                        )}
                        {batch && <BatchStatusBadge value={batch.status} />}
                        {draft && <span className="badge batch-expired">草稿 {draft.sync_state === "CONFLICT" ? "·待重选" : "·待同步"}</span>}
                      </div>
                      <p className="step-desc">{step.material_used}
                        {batch ? ` ｜ 当前批次 ${batch.batch_no} ｜ 用量 ${step.quantity_used}` : " ｜ 旧步骤未登记批次版本"}
                        {step.rework_reason ? ` ｜ 退回原因：${step.rework_reason}` : ""}
                      </p>
                      {stepImages.length > 0 && (
                        <p className="step-images">影像凭证：{stepImages.map((img) => `${img.version_no}(${img.note})`).join("、")}</p>
                      )}

                      {isOldStep && !planArchived && (
                        <button className="small" onClick={() => backfill(step.id, null)}>旧步骤按当前台账补齐批次版本</button>
                      )}

                      {!planArchived && step.execution_status !== "FINISHED" && (
                        <RequisitionForm step={step} batches={batches} images={images} operatorId={operatorId} operatorName={operatorName} />
                      )}

                      {!planArchived && step.execution_status !== "FINISHED" && stepImages.length > 0 && (
                        <button className="small finish" onClick={() => finish(step.id, stepImages[0].id, operatorId)}>
                          质检完成（锁定用量与凭证）
                        </button>
                      )}
                      {step.execution_status === "FINISHED" && (
                        <p className="finished-note">已完成于 {step.finished_at?.slice(0, 16).replace("T", " ")}，原用量保留，批次失效不再冲回。</p>
                      )}
                    </div>
                  );
                })}
              </article>
            );
          })}
        </div>

        <div className="panel">
          <h2>材料批次台账</h2>
          <div className="batch-list">
            {batches.map((b) => (
              <div key={b.id} className="batch-row">
                <div>
                  <strong>{b.batch_no}</strong> <BatchStatusBadge value={b.status} />
                  <div className="muted">{b.material_name}｜{b.spec}｜余量 {b.remaining_quantity}/{b.total_quantity}</div>
                  <div className="muted">到期 {b.expires_at.slice(0, 10)}</div>
                </div>
                <div className="batch-actions">
                  <button className="tiny" onClick={() => replenish(b.id, 100)}>补货</button>
                  <button className="tiny warn" onClick={() => { void recall(b.id).then(refreshAll); }}>召回</button>
                  <button className="tiny warn" onClick={() => { void expire(b.id).then(refreshAll); }}>过期</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
