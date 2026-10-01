import { useEffect, useMemo, useState } from "react";
import { useDamageRecordStore } from "../stores/DamageRecordStore";
import { useRelicItemStore } from "../stores/RelicItemStore";
import { StatusBadge } from "../components/common/StatusBadge";
import { SeverityBadge } from "../components/common/SeverityBadge";
import { EmptyState } from "../components/common/EmptyState";
import { formatDate } from "../utils/formatters";

export function DamagesPage() {
  const { rows: damages, load: loadDamages } = useDamageRecordStore();
  const { rows: relics, load: loadRelics } = useRelicItemStore();
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  useEffect(() => {
    loadDamages();
    loadRelics();
  }, [loadDamages, loadRelics]);

  const relicMap = useMemo(() => new Map(relics.map((relic) => [relic.id, relic])), [relics]);

  const filtered = useMemo(() => {
    if (severityFilter === "ALL") return damages;
    return damages.filter((damage) => damage.severity === severityFilter);
  }, [damages, severityFilter]);

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">病害记录</p>
          <h1>病害记录</h1>
        </div>
        <StatusBadge value="DAMAGE" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>病害列表</h2>
          <div className="btn-group">
            {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((sev) => (
              <button
                key={sev}
                className={severityFilter === sev ? "primary" : ""}
                onClick={() => setSeverityFilter(sev)}
              >
                {sev === "ALL" ? "全部" : sev}
              </button>
            ))}
          </div>
        </div>

        <div className="table">
          {filtered.length === 0 && <EmptyState title="暂无病害记录" />}
          {filtered.map((damage) => {
            const relic = relicMap.get(damage.relic_id);
            return (
              <article key={damage.id} className="row">
                <strong>{damage.damage_type}</strong>
                <span className="muted">{relic?.name ?? "-"}</span>
                <span className="muted">{damage.position_desc}</span>
                <SeverityBadge value={damage.severity} />
                <StatusBadge value={damage.status} />
                <span className="muted">{damage.discovered_by}</span>
                <span className="muted">{formatDate(damage.discovered_at)}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
