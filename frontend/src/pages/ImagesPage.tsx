import { useEffect, useMemo, useState } from "react";
import { useImageVersionStore } from "../stores/ImageVersionStore";
import { useMaterialRequisitionStore } from "../stores/MaterialRequisitionStore";
import { useRestorationStepStore } from "../stores/RestorationStepStore";
import { StatusBadge } from "../components/common/StatusBadge";
import { RequisitionStatusBadge } from "../components/common/RequisitionStatusBadge";
import { ImageCompare } from "../components/common/ImageCompare";
import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/common/StatCard";
import { createImageVersionForm } from "../constructors/ImageVersionConstructor";
import { formatDate } from "../utils/formatters";

export function ImagesPage() {
  const { rows: images, load: loadImages } = useImageVersionStore();
  const { rows: requisitions, load: loadRequisitions } = useMaterialRequisitionStore();
  const { rows: steps, load: loadSteps } = useRestorationStepStore();
  const [filter, setFilter] = useState<"ALL" | "WITH_EVIDENCE" | "MISSING">("ALL");

  useEffect(() => {
    loadImages();
    loadRequisitions();
    loadSteps();
  }, [loadImages, loadRequisitions, loadSteps]);

  const requisitionMap = useMemo(
    () => new Map(requisitions.map((req) => [req.id, req])),
    [requisitions]
  );
  const stepMap = useMemo(() => new Map(steps.map((step) => [step.id, step])), [steps]);

  const confirmedRequisitions = useMemo(
    () => requisitions.filter((req) => req.status === "CONFIRMED"),
    [requisitions]
  );
  const evidencedReqIds = useMemo(
    () => new Set(images.filter((img) => img.requisition_id).map((img) => img.requisition_id)),
    [images]
  );
  const missingEvidence = useMemo(
    () => confirmedRequisitions.filter((req) => !evidencedReqIds.has(req.id)),
    [confirmedRequisitions, evidencedReqIds]
  );

  const filteredImages = useMemo(() => {
    if (filter === "WITH_EVIDENCE") return images.filter((img) => img.requisition_id);
    if (filter === "MISSING") return images.filter((img) => !img.requisition_id);
    return images;
  }, [images, filter]);

  const handleAddEvidence = (requisitionId: number, stepId: number) => {
    // 构造默认影像凭证（实际项目中此处会打开上传弹窗）。
    const form = createImageVersionForm({
      plan_id: stepMap.get(stepId)?.plan_id ?? 0,
      step_id: stepId,
      requisition_id: requisitionId,
      version_no: `EV-${requisitionId}`,
      note: "领用影像凭证"
    });
    console.info("add image evidence", form);
    loadImages();
  };

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">影像版本</p>
          <h1>影像版本与领用凭证</h1>
        </div>
        <StatusBadge value="EVIDENCE" />
      </div>

      <section className="metrics">
        <StatCard label="影像版本" value={images.length} />
        <StatCard label="已关联凭证" value={images.filter((img) => img.requisition_id).length} />
        <StatCard label="缺凭证领用" value={missingEvidence.length} />
      </section>

      <div className="panel">
        <div className="panel-head">
          <h2>影像列表</h2>
          <div className="btn-group">
            <button className={filter === "ALL" ? "primary" : ""} onClick={() => setFilter("ALL")}>
              全部
            </button>
            <button
              className={filter === "WITH_EVIDENCE" ? "primary" : ""}
              onClick={() => setFilter("WITH_EVIDENCE")}
            >
              已关联凭证
            </button>
            <button className={filter === "MISSING" ? "primary" : ""} onClick={() => setFilter("MISSING")}>
              未关联
            </button>
          </div>
        </div>

        {missingEvidence.length > 0 && (
          <div className="notice error">
            {missingEvidence.length} 笔已确认领用缺少影像凭证，专家复算将不予通过。
          </div>
        )}

        <div className="table">
          {filteredImages.length === 0 && <EmptyState title="暂无影像版本" />}
          {filteredImages.map((img) => {
            const req = img.requisition_id ? requisitionMap.get(img.requisition_id) : undefined;
            return (
              <article key={img.id} className="row">
                <ImageCompare title={img.version_no} value={img.image_type} />
                <span className="muted">{img.note}</span>
                <span className="muted">{formatDate(img.capture_at)}</span>
                {req ? (
                  <span className="muted">
                    领用凭证 {req.request_no} · 步骤 {img.step_id}
                  </span>
                ) : (
                  <span className="muted">未关联领用</span>
                )}
                {req && <RequisitionStatusBadge status={req.status} />}
              </article>
            );
          })}
        </div>
      </div>

      {missingEvidence.length > 0 && (
        <div className="panel">
          <h2>待补凭证的领用</h2>
          <div className="table">
            {missingEvidence.map((req) => (
              <article key={req.id} className="row">
                <strong>{req.request_no}</strong>
                <span className="muted">
                  步骤 {req.step_id} · 用量 {req.qty}
                </span>
                <RequisitionStatusBadge status={req.status} />
                <button type="button" onClick={() => handleAddEvidence(req.id, req.step_id)}>
                  上传凭证
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
