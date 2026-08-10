import { colorForId, type ActivityLogItem } from "./types";

export function HistoryModal({
  log,
  onClose,
}: {
  log: ActivityLogItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-blur-heavy animate-fade-up flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-3.5">
          <div>
            <strong className="font-mono text-xs text-white">수정 이력</strong>
            <div className="mt-0.5 font-mono text-[10px] text-white/30">
              {log.title}
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 text-sm text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[320px] space-y-3 overflow-y-auto p-5">
          {log.edits.map((h, i) => (
            <div
              key={i}
              className="border-b border-white/5 pb-2.5 pt-1 last:border-none"
            >
              <div className="mb-1 flex items-center gap-2 font-mono text-[11px]">
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white"
                  style={{ background: colorForId(h.actorId) }}
                >
                  {h.actorName.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-white/80">{h.actorName}</span>
                <span className="text-white/40">{h.action}</span>
                <span className="ml-auto text-white/20">
                  {new Date(h.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>
              {h.snapshot && (
                <div className="mt-1.5 max-h-[90px] overflow-hidden whitespace-pre-wrap rounded-lg border border-white/5 bg-black/40 p-2 font-mono text-[11px] text-white/40">
                  {h.snapshot}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
