import { useMemo, useState } from "react";
import type { RestorationStep } from "../../types/RestorationStep";
import type { MaterialBatch } from "../../types/MaterialBatch";
import type { ImageVersion } from "../../types/ImageVersion";
import { useRequisitionStore } from "../../stores/RequisitionStore";
import { createRequisitionPayload } from "../../constructors/RequisitionConstructor";
import { BatchStatusBadge } from "./BatchStatusBadge";

/**
 * 修复师在步骤上提交批次与用量的表单。
 * 只允许选择合格且余量 > 0 的批次；影像凭证下拉只列属于本步骤的版本；
 * 断网时由 store 落草稿，回网后统一合并。
 */
export function RequisitionForm({
  step,
  batches,
  images,
  operatorId,
  operatorName
}: {
  step: RestorationStep;
  batches: MaterialBatch[];
  images: ImageVersion[];
  operatorId: number;
  operatorName: string;
}) {
  const submit = useRequisitionStore((s) => s.submit);
  const online = useRequisitionStore((s) => s.online);

  const archived = step.execution_status === "FINISHED";
  const selectableBatches = useMemo(
    () => batches.filter((b) => b.status === "ACTIVE" && b.remaining_quantity > 0 && new Date(b.expires_at).getTime() > Date.now()),
    [batches]
  );
  const stepImages = useMemo(() => images.filter((img) => img.step_id === step.id), [images, step.id]);

  const [batchId, setBatchId] = useState<number>(step.batch_id ?? selectableBatches[0]?.id ?? 0);
  const [quantity, setQuantity] = useState<number>(step.quantity_used || 10);
  const [imageId, setImageId] = useState<number>(step.image_version_id ?? stepImages[0]?.id ?? 0);

  const chosen = batches.find((b) => b.id === batchId);
  const insufficient = chosen ? quantity > chosen.remaining_quantity : false;

  const onSubmit = async () => {
    const payload = createRequisitionPayload({
      stepId: step.id,
      batchId,
      quantity,
      baseVersion: step.base_version,
      imageVersionId: imageId || null,
      operatorId
    });
    await submit(payload, operatorName);
  };

  if (archived) {
    return (
      <div className="requisition-form frozen">
        <p>步骤已完成，原用量 <strong>{step.quantity_used}</strong> 与批次版本保留，禁止再领用。</p>
      </div>
    );
  }

  return (
    <div className="requisition-form">
      {step.execution_status === "REWORK_PENDING" && (
        <div className="rework-banner">批次{step.rework_reason ? `（${step.rework_reason}）` : ""}，步骤已退回重算，请重新选择批次</div>
      )}
      <label>
        材料批次
        <select value={batchId} onChange={(e) => setBatchId(Number(e.target.value))}>
          {selectableBatches.length === 0 && <option value={0}>无可用批次</option>}
          {selectableBatches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.batch_no}｜{b.material_name}｜余量 {b.remaining_quantity}
            </option>
          ))}
        </select>
      </label>
      {chosen && (
        <p className="batch-hint">
          <BatchStatusBadge value={chosen.status} /> 总量 {chosen.total_quantity} / 余量 {chosen.remaining_quantity}，到期 {chosen.expires_at.slice(0, 10)}
        </p>
      )}
      <label>
        用量
        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        {insufficient && <span className="field-error">余量不足，请选替代批次</span>}
      </label>
      <label>
        影像凭证（须为本步骤影像）
        <select value={imageId} onChange={(e) => setImageId(Number(e.target.value))}>
          <option value={0}>未选择</option>
          {stepImages.map((img) => (
            <option key={img.id} value={img.id}>{img.version_no}｜{img.note}</option>
          ))}
        </select>
      </label>
      <button className="primary" disabled={!batchId || quantity <= 0 || insufficient} onClick={onSubmit}>
        {online ? "提交批次用量" : "断网暂存草稿"}
      </button>
    </div>
  );
}
