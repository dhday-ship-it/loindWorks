import { Icon, type IconName } from "@/components/ui/Icon";
import type { WorkSummary } from "@/types/shared";

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm shadow-brand/5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-white">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-slate-400">{label}</div>
        <div className="truncate text-base font-bold text-slate-800">{value}</div>
        {sub && <div className="truncate text-[10px] text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export function StatsStrip({ works }: { works: WorkSummary[] }) {
  const active = works.filter((w) => w.status !== "DONE");
  const done = works.filter((w) => w.status === "DONE");
  const upcoming = active
    .filter((w) => w.endDate)
    .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())[0];

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard icon="folder" label="진행중 Works" value={`${active.length}건`} />
      <StatCard
        icon="chart"
        label="다가오는 마감"
        value={upcoming ? fmtDate(upcoming.endDate) : "-"}
        sub={upcoming?.name}
      />
      <StatCard icon="receipt" label="완료된 Works" value={`${done.length}건`} />
    </div>
  );
}
