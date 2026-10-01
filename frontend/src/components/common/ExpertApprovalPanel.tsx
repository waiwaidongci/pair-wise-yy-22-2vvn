import { useState } from "react";
import type { RestorationPlan } from "../../types/RestorationPlan";
import { useRequisitionStore } from "../../stores/RequisitionStore";
import { useRestorationPlanStore } from "../../stores/RestorationPlanStore";

/**
 * 专家复算面板：先拉取方案领用链台账，核对影像凭证后回填复算总量，
 * 与台账一致才能通过；档案员可在复算通过后归档。
 */
export function ExpertApprovalPanel({ plan }: { plan: RestorationPlan }) {
  const loadChain = useRequisitionStore((s) => s.loadChain);
  const recalculate = useRestorationPlanStore((s) => s.recalculate);
  const archive = useRestorationPlanStore((s) => s.archive);
  const [ledgerTotal, setLedgerTotal] = useState<number | null>(plan.ledger_total);
  const [input, setInput] = useState<string>(String(plan.recalculated_total ?? ""));
  const [loaded, setLoaded] = useState(false);

  const archived = plan.approval_status === "ARCHIVED";

  const onLoadChain = async () => {
    const chain = await loadChain(plan.id);
    setLedgerTotal(chain.ledger_total);
    setInput(String(chain.ledger_total));
    setLoaded(true);
  };

  return (
    <div className="expert-panel">
      <div className="expert-row">
        <button className="small" onClick={onLoadChain}>拉取领用台账核对</button>
        <span>台账实际用量：<strong>{loaded || ledgerTotal != null ? ledgerTotal : "—"}</strong></span>
      </div>
      {!archived && (
        <div className="expert-row">
          <label>
            专家复算总量
            <input type="number" value={input} onChange={(e) => setInput(e.target.value)} disabled={!loaded && ledgerTotal == null} />
          </label>
          <button className="primary small" disabled={input === ""} onClick={() => recalculate(plan.id, Number(input))}>
            复算后通过
          </button>
        </div>
      )}
      <div className="expert-row">
        {plan.material_rechecked ? <span className="badge step-finished">已复算</span> : <span className="badge step-rework">待复算</span>}
        {!archived && plan.approval_status === "APPROVED" && plan.material_rechecked && (
          <button className="small archive" onClick={() => archive(plan.id)}>档案员归档（冻结领用）</button>
        )}
        {archived && <span className="badge batch-depleted">已归档 · 禁止领用</span>}
      </div>
    </div>
  );
}
