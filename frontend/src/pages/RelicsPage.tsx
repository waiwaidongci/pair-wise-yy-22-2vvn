import { useEffect, useMemo, useState } from "react";
import { useRelicItemStore } from "../stores/RelicItemStore";
import { useDamageRecordStore } from "../stores/DamageRecordStore";
import { useImageVersionStore } from "../stores/ImageVersionStore";
import { StatusBadge } from "../components/common/StatusBadge";
import { SeverityBadge } from "../components/common/SeverityBadge";
import { RelicInfoCard } from "../components/common/RelicInfoCard";
import { ImageCompare } from "../components/common/ImageCompare";
import { EmptyState } from "../components/common/EmptyState";
import { formatDate } from "../utils/formatters";

export function RelicsPage() {
  const { rows: relics, load: loadRelics } = useRelicItemStore();
  const { rows: damages, load: loadDamages } = useDamageRecordStore();
  const { rows: images, load: loadImages } = useImageVersionStore();
  const [activeRelicId, setActiveRelicId] = useState<number | null>(null);

  useEffect(() => {
    loadRelics();
    loadDamages();
    loadImages();
  }, [loadRelics, loadDamages, loadImages]);

  const activeRelic = useMemo(
    () => relics.find((relic) => relic.id === activeRelicId),
    [relics, activeRelicId]
  );
  const relicDamages = useMemo(
    () => damages.filter((damage) => damage.relic_id === activeRelicId),
    [damages, activeRelicId]
  );
  const relicImages = useMemo(
    () => images.filter((image) => image.relic_id === activeRelicId),
    [images, activeRelicId]
  );

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">文物档案</p>
          <h1>文物档案</h1>
        </div>
        <StatusBadge value="ARCHIVE" />
      </div>

      <div className="plans-layout">
        <div className="panel">
          <div className="panel-head">
            <h2>藏品列表</h2>
          </div>
          <div className="table">
            {relics.map((relic) => (
              <article
                key={relic.id}
                className={"row clickable" + (activeRelicId === relic.id ? " active" : "")}
                onClick={() => setActiveRelicId(relic.id)}
              >
                <strong>{relic.name}</strong>
                <span className="muted">{relic.relic_code}</span>
                <StatusBadge value={relic.current_condition} />
              </article>
            ))}
          </div>
        </div>

        <div className="panel wide">
          {!activeRelic ? (
            <EmptyState title="请选择一件藏品查看档案" />
          ) : (
            <>
              <RelicInfoCard title={activeRelic.name} value={activeRelic.current_condition} />
              <div className="muted relic-meta">
                {activeRelic.era} · {activeRelic.material} · {activeRelic.collection_level} ·{" "}
                {activeRelic.storage_location}
              </div>

              <div className="panel-head">
                <h2>病害记录</h2>
              </div>
              <div className="table">
                {relicDamages.length === 0 && <EmptyState title="暂无病害记录" />}
                {relicDamages.map((damage) => (
                  <article key={damage.id} className="row">
                    <strong>{damage.damage_type}</strong>
                    <span className="muted">{damage.position_desc}</span>
                    <SeverityBadge value={damage.severity} />
                    <StatusBadge value={damage.status} />
                    <span className="muted">{formatDate(damage.discovered_at)}</span>
                  </article>
                ))}
              </div>

              <div className="panel-head">
                <h2>影像版本</h2>
              </div>
              <div className="table">
                {relicImages.length === 0 && <EmptyState title="暂无影像版本" />}
                {relicImages.map((image) => (
                  <article key={image.id} className="row">
                    <ImageCompare title={image.version_no} value={image.image_type} />
                    <span className="muted">{image.note}</span>
                    <span className="muted">{formatDate(image.capture_at)}</span>
                    {image.requisition_id ? (
                      <span className="muted">领用凭证 #{image.requisition_id}</span>
                    ) : (
                      <span className="muted">未关联领用</span>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
