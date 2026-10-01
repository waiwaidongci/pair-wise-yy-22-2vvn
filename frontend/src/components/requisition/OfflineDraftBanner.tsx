import { useState } from "react";
import { useOfflineDraft } from "../../hooks/useOfflineDraft";

/**
 * 离线草稿横幅：展示未合并的草稿数量，回网后一键按步骤合并。
 */
export function OfflineDraftBanner() {
  const { online, drafts, merging, mergeDrafts, draftCount } = useOfflineDraft();
  const [message, setMessage] = useState<string | null>(null);

  if (draftCount === 0) return null;

  const handleMerge = async () => {
    const result = await mergeDrafts();
    if (result.conflicts.length > 0) {
      setMessage(
        `已合并 ${result.merged} 份；${result.conflicts.length} 份冲突，请重新选择批次：${result.conflicts
          .map((c) => `步骤${c.step_id}`)
          .join("、")}`
      );
    } else {
      setMessage(`已按步骤合并 ${result.merged} 份草稿`);
    }
  };

  return (
    <div className={"offline-banner" + (online ? " online" : " offline")}>
      <span>
        {online ? "已回网" : "断网中"} · {draftCount} 份领用草稿待合并
      </span>
      <button type="button" disabled={merging || !online} onClick={handleMerge}>
        {merging ? "合并中…" : "回网合并"}
      </button>
      {message && <div className="offline-banner-msg">{message}</div>}
      {!online && (
        <div className="offline-banner-msg muted">断网期间提交的领用会先存为草稿，回网后按步骤合并。</div>
      )}
    </div>
  );
}
