import type { AdminProjectItem, AdminStats } from "./types";

const STATUS_LABEL: Record<AdminProjectItem["status"], string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};
const STATUS_CLASS: Record<AdminProjectItem["status"], string> = {
  PENDING: "admin-badge admin-b-pending",
  IN_PROGRESS: "admin-badge admin-b-wip",
  DONE: "admin-badge admin-b-done",
};

export function OverviewPage({
  stats,
  inProgressProjects,
  onNavigateProjects,
}: {
  stats: AdminStats;
  inProgressProjects: AdminProjectItem[];
  onNavigateProjects: () => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[22px] font-bold text-slate-800">전체 현황</div>
        <div className="text-xs text-slate-500">
          Works, 계정, 고객사 현황을 한눈에 확인하세요.
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            진행 중 Works
          </div>
          <div className="my-1 text-3xl tracking-wide text-brand">
            {stats.activeProjects}
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-400">
            전체 {stats.totalProjects}개 중
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            전체 계정
          </div>
          <div className="my-1 text-3xl tracking-wide text-slate-800">
            {stats.staffCount + stats.pmCount}
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-400">
            Creator {stats.staffCount} · PM {stats.pmCount}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            고객사
          </div>
          <div className="my-1 text-3xl tracking-wide text-brand-light">
            {stats.companyCount}
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-400">
            활성 {stats.companyCount}개
          </div>
        </div>
      </div>

      <div className="admin-sec-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-bold text-slate-800">
            진행 중인 Works
          </div>
          <button
            onClick={onNavigateProjects}
            className="admin-btn-primary"
            style={{ fontSize: 11, padding: "5px 12px" }}
          >
            전체 보기 →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full border-collapse">
            <thead>
              <tr>
                <th>Works</th>
                <th>고객사</th>
                <th>담당 PM</th>
                <th>마감일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {inProgressProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    진행 중인 Works가 없습니다.
                  </td>
                </tr>
              )}
              {inProgressProjects.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-slate-800">{p.name}</td>
                  <td>{p.company?.name ?? "-"}</td>
                  <td>{p.pm?.name ?? p.pm?.email ?? "-"}</td>
                  <td className="font-mono text-[11px]">
                    {p.endDate
                      ? new Date(p.endDate).toLocaleDateString("ko-KR")
                      : "-"}
                  </td>
                  <td>
                    <span className={STATUS_CLASS[p.status]}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
