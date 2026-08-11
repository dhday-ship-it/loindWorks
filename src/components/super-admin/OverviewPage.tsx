import { progressPercent } from "@/lib/project-progress";
import type {
  AdminProjectItem,
  AdminStats,
  UnhandledRequestItem,
} from "./types";

const STATUS_LABEL: Record<AdminProjectItem["status"], string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
};
const STATUS_CLASS: Record<AdminProjectItem["status"], string> = {
  PENDING: "admin-badge admin-b-pending",
  IN_PROGRESS: "admin-badge admin-b-wip",
  DONE: "admin-badge admin-b-done",
};

function progressOf(p: AdminProjectItem) {
  return progressPercent(p.status, p.currentPhase, p.phaseCount);
}

export function OverviewPage({
  stats,
  inProgressProjects,
  unhandledRequests,
  unhandledContacts,
  onNavigateProjects,
  onNavigateContacts,
}: {
  stats: AdminStats;
  inProgressProjects: AdminProjectItem[];
  unhandledRequests: UnhandledRequestItem[];
  unhandledContacts: number;
  onNavigateProjects: () => void;
  onNavigateContacts: () => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[22px] font-bold text-white">전체 현황</div>
        <div className="text-xs text-white/40">
          프로젝트, 계정, 고객사 현황을 한눈에 확인하세요.
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            진행 중 프로젝트
          </div>
          <div className="my-1 text-3xl tracking-wide text-blue-300">
            {stats.activeProjects}
          </div>
          <div className="mt-1 font-mono text-[10px] text-white/28">
            전체 {stats.totalProjects}개 중
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            전체 계정
          </div>
          <div className="my-1 text-3xl tracking-wide text-white">
            {stats.staffCount + stats.clientCount}
          </div>
          <div className="mt-1 font-mono text-[10px] text-white/28">
            Staff {stats.staffCount} · Client {stats.clientCount}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            고객사
          </div>
          <div className="my-1 text-3xl tracking-wide text-brand-light">
            {stats.companyCount}
          </div>
          <div className="mt-1 font-mono text-[10px] text-white/28">
            활성 {stats.companyCount}개
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            미처리 요청
          </div>
          <div className="my-1 text-3xl tracking-wide text-amber-300">
            {stats.unhandledCount}
          </div>
          <div className="mt-1 font-mono text-[10px] text-white/28">
            이번 주 신규 {stats.newRequestsThisWeek}건
          </div>
        </div>
        <div
          className="admin-stat-card cursor-pointer px-4 py-4"
          onClick={onNavigateContacts}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            미확인 문의
          </div>
          <div className="my-1 text-3xl tracking-wide text-brand-light">
            {unhandledContacts}
          </div>
          <div className="mt-1 font-mono text-[10px] text-white/28">
            Contact 폼 신규 문의
          </div>
        </div>
      </div>

      <div className="admin-sec-card mb-5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-bold text-white/88">
            진행 중인 프로젝트
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
                <th>프로젝트</th>
                <th>고객사</th>
                <th>담당 PM</th>
                <th>진행률</th>
                <th>마감일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {inProgressProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-white/30">
                    진행 중인 프로젝트가 없습니다.
                  </td>
                </tr>
              )}
              {inProgressProjects.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-white">{p.name}</td>
                  <td>{p.company?.name ?? "-"}</td>
                  <td>{p.pm?.name ?? p.pm?.email ?? "-"}</td>
                  <td style={{ minWidth: 120 }}>
                    <div className="flex items-center gap-2">
                      <div className="admin-prog-track flex-1">
                        <div
                          className="admin-prog-fill"
                          style={{ width: `${progressOf(p)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-white/60">
                        {progressOf(p)}%
                      </span>
                    </div>
                  </td>
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

      <div className="admin-sec-card p-6">
        <div className="mb-4">
          <div className="text-[13px] font-bold text-white/88">
            미처리 요청사항
          </div>
          <div className="mt-0.5 text-[11px] text-white/35">
            상태가 &apos;대기&apos;인 담당자가 남아있는 요청
          </div>
        </div>
        {unhandledRequests.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-white/5 bg-black/10 py-10 font-mono text-xs text-white/25">
            미처리 요청이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-tbl w-full border-collapse">
              <thead>
                <tr>
                  <th>요청자</th>
                  <th>프로젝트</th>
                  <th>내용</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {unhandledRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-white/90">
                      {r.authorName}
                    </td>
                    <td>{r.projectName}</td>
                    <td className="max-w-[320px] truncate text-white/75">
                      {r.body}
                    </td>
                    <td className="font-mono text-[11px] text-white/40">
                      {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
