import { useEffect, useState } from "react";
import { listMaterialBatch } from "../../api/MaterialBatch";
import type { MaterialBatch } from "../../types/MaterialBatch";
import { MaterialBatchBadge } from "../common/MaterialBatchBadge";
import { formatDate } from "../../utils/formatters";

interface Props {
  value: number | null;
  qty: number;
  alternatives?: MaterialBatch[];
  conflict?: boolean;
  onChange: (batch: MaterialBatch) => void;
}

/**
 * 批次选择器。
 * 正常情况列出可用批次；当服务端返回冲突/不足时，高亮替代批次供重新选择。
 */
export function BatchPicker({ value, qty, alternatives, conflict, onChange }: Props) {
  const [batches, setBatches] = useState<MaterialBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMaterialBatch().then((rows) => {
      setBatches(rows);
      setLoading(false);
    });
  }, []);

  const altIds = new Set((alternatives ?? []).map((batch) => batch.id));
  const usable = batches.filter((batch) => batch.status === "ACTIVE" && batch.remaining_qty > 0);
  const shown = conflict && alternatives && alternatives.length > 0 ? alternatives : usable;

  if (loading) return <div className="batch-picker muted">批次加载中…</div>;

  return (
    <div className="batch-picker">
      {conflict && alternatives && alternatives.length > 0 && (
        <div className="batch-picker-hint">批次已失效或余量不足，请从替代批次中重新选择：</div>
      )}
      <div className="batch-grid">
        {shown.map((batch) => {
          const disabled = batch.remaining_qty < qty;
          const selected = value === batch.id;
          return (
            <button
              key={batch.id}
              type="button"
              className={
                "batch-card" +
                (selected ? " selected" : "") +
                (disabled ? " disabled" : "") +
                (altIds.has(batch.id) ? " alternative" : "")
              }
              disabled={disabled}
              onClick={() => onChange(batch)}
            >
              <div className="batch-card-head">
                <strong>{batch.batch_no}</strong>
                <MaterialBatchBadge status={batch.status} />
              </div>
              <div className="batch-card-body">
                <span>{batch.material_name}</span>
                <span className="muted">{batch.spec}</span>
                <span className="muted">效期 {formatDate(batch.expiry_date)}</span>
              </div>
              <div className="batch-card-foot">
                <span>
                  余量 <strong>{batch.remaining_qty}</strong> {batch.unit}
                </span>
                {disabled && <span className="muted">（不足 {qty}）</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
