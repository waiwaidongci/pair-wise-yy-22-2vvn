import { useMemo, useState } from "react";
import type { RestorationStep } from "../../types/RestorationStep";
import type { MaterialBatch } from "../../types/MaterialBatch";
import type { SubmitRequisitionResult } from "../../types/MaterialRequisition";
import { submitStepRequisition } from "../../api/RestorationStep";
import { BatchPicker } from "./BatchPicker";
import { useOfflineDraft } from "../../hooks/useOfflineDraft";
import { ERROR_MESSAGES } from "../../constants/errorMessages";

interface Props {
  step: RestorationStep;
  operatorId?: number;
  onSubmitted: (result: SubmitRequisitionResult) => void;
}

const newRequestNo = (): string =>
  `REQ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * 修复师在步骤上提交批次和用量。
 * - 在线：直接提交，按请求号幂等，按台账版本做冲突检测。
 * - 断网：先存草稿，回网后按步骤合并。
 * - 冲突（后到方）：展示替代批次，重新选择后再提交。
 */
export function RequisitionForm({ step, operatorId, onSubmitted }: Props) {
  const [batch, setBatch] = useState<MaterialBatch | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [alternatives, setAlternatives] = useState<MaterialBatch[]>([]);
  const [savedOffline, setSavedOffline] = useState(false);
  const { online, saveDraft } = useOfflineDraft();

  const requestNo = useMemo(() => newRequestNo(), [step.id]);

  const handleSubmit = async () => {
    if (!batch) {
      setError("请选择材料批次");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      step_id: step.id,
      batch_id: batch.id,
      qty,
      request_no: requestNo,
      operator_id: operatorId,
      base_ledger_version: step.ledger_version
    };

    if (!online) {
      // 现场断网：先存草稿。
      saveDraft(payload);
      setSavedOffline(true);
      setSubmitting(false);
      return;
    }

    try {
      const result = await submitStepRequisition(payload);
      onSubmitted(result);
    } catch (err) {
      const code = (err as { code?: string }).code;
      const alts = (err as { alternatives?: MaterialBatch[] }).alternatives ?? [];
      if (code === "REQUISITION_CONFLICT" || code === "BATCH_INACTIVE" || code === "BATCH_EXPIRED" || code === "BATCH_INSUFFICIENT") {
        setConflict(true);
        setAlternatives(alts);
        setError(
          code === "REQUISITION_CONFLICT"
            ? ERROR_MESSAGES.REQUISITION_CONFLICT
            : code === "BATCH_INSUFFICIENT"
              ? ERROR_MESSAGES.BATCH_INSUFFICIENT
              : ERROR_MESSAGES.BATCH_INACTIVE
        );
      } else {
        setError((err as Error).message || "领用失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="requisition-form">
      <div className="requisition-form-head">
        <strong>步骤 {step.id} · 领用材料</strong>
        {!online && <span className="badge batch-expired">断网 · 草稿将在回网后合并</span>}
        {savedOffline && <span className="badge batch-active">已存为离线草稿</span>}
      </div>

      <BatchPicker
        value={batch?.id ?? null}
        qty={qty}
        alternatives={alternatives}
        conflict={conflict}
        onChange={(selected) => {
          setBatch(selected);
          setConflict(false);
          setError(null);
        }}
      />

      <div className="requisition-form-row">
        <label>
          用量
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>
        <button type="button" className="primary" disabled={submitting} onClick={handleSubmit}>
          {submitting ? "提交中…" : online ? "提交领用" : "存为草稿"}
        </button>
      </div>

      {error && <div className="requisition-error">{error}</div>}
      {conflict && alternatives.length > 0 && (
        <div className="requisition-hint">请在上方替代批次中重新选择后再次提交。</div>
      )}
    </div>
  );
}
