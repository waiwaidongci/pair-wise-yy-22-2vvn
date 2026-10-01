import { useEffect } from "react";
import { useRequisitionStore } from "../../stores/RequisitionStore";
import { isOnline } from "../../api/http";

/**
 * 离线草稿条：监听浏览器联网状态，断网提示草稿数，
 * 回网后可一键「按步骤合并」同步；冲突草稿就地提示重新选择。
 */
export function OfflineDraftBar() {
  const drafts = useRequisitionStore((s) => s.drafts);
  const online = useRequisitionStore((s) => s.online);
  const setOnline = useRequisitionStore((s) => s.setOnline);
  const syncDrafts = useRequisitionStore((s) => s.syncDrafts);
  const refreshDrafts = useRequisitionStore((s) => s.refreshDrafts);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      refreshDrafts();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setOnline(isOnline());
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [setOnline, refreshDrafts]);

  const pending = drafts.filter((d) => d.sync_state !== "SYNCED");
  if (pending.length === 0 && online) return null;

  return (
    <div className={`draft-bar ${online ? "" : "offline"}`}>
      <span>
        {online ? `回网：有 ${pending.length} 条步骤草稿待合并` : "现场断网：用量将先存为本地草稿，回网后按步骤合并"}
      </span>
      {online && pending.length > 0 && (
        <button className="primary small" onClick={() => syncDrafts()}>按步骤合并同步</button>
      )}
    </div>
  );
}
