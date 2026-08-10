"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import type { LogType, ProjectStatus } from "@/generated/prisma/enums";
import { ParticleBackground } from "@/components/ParticleBackground";
import { progressPercent } from "@/lib/project-progress";
import { colorForId, type Person, type ProjectDetail, type ProjectRequestItem } from "@/components/staff-projects/types";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PENDING: "예정",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
};

const LOG_TYPE_META: Record<LogType, { icon: string; cls: string }> = {
  CALL: { icon: "📞", cls: "border-emerald-500/25 text-emerald-400 bg-emerald-500/10" },
  MEET: { icon: "👥", cls: "border-blue-500/25 text-blue-400 bg-blue-500/10" },
  MSG: { icon: "💬", cls: "border-amber-500/25 text-amber-400 bg-amber-500/10" },
  EMAIL: { icon: "✉️", cls: "border-red-500/25 text-red-400 bg-red-500/10" },
  NOTE: { icon: "📝", cls: "border-white/20 text-white/60 bg-white/10" },
};

function timeAgo(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function requestBadge(request: ProjectRequestItem, currentUserId: string) {
  const isMine = request.author.id === currentUserId;
  const allDone =
    request.assignees.length > 0 &&
    request.assignees.every((a) => a.status === "DONE");

  if (allDone) {
    return { label: "완료", cls: "border-emerald-500/28 bg-emerald-500/13 text-emerald-300" };
  }
  if (isMine) {
    return { label: "전달됨", cls: "border-amber-500/26 bg-amber-500/10 text-amber-300" };
  }
  return { label: "신규", cls: "border-violet-400/32 bg-violet-400/15 text-violet-300" };
}

export function ClientProjectDetail({
  project: initialProject,
  currentUser,
}: {
  project: ProjectDetail;
  currentUser: Person;
}) {
  const [project, setProject] = useState(initialProject);
  const [leftTab, setLeftTab] = useState<"brief" | "info">("brief");
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = project.phases.length;
  const current = project.currentPhase;
  const progressPct = progressPercent(project.status, current, total);

  const doneCount = project.requests.filter(
    (r) => r.assignees.length > 0 && r.assignees.every((a) => a.status === "DONE")
  ).length;
  const reviewCount = project.requests.length - doneCount;

  const team = [
    ...(project.pm ? [{ user: project.pm, label: "Project Manager" }] : []),
    ...project.members
      .filter((m) => m.roleLabel === "팀원" && m.user.id !== project.pm?.id)
      .map((m) => ({ user: m.user, label: "팀원" })),
  ];

  const submitRequest = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/projects/${project.id}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setSubmitting(false);
    if (res.ok) {
      const { request } = await res.json();
      setProject((prev) => ({ ...prev, requests: [request, ...prev.requests] }));
      setTitle("");
      setBody("");
      setShowCompose(false);
    }
  };

  return (
    <div
      className={`${dmSans.className} relative flex h-screen flex-col overflow-hidden text-white`}
    >
      <ParticleBackground />
      <nav className="flex h-14 w-full shrink-0 items-center border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="flex h-full items-center gap-3.5 border-r border-white/10 px-6">
          <span className={`${bebasNeue.className} text-xl tracking-widest text-white/95`}>
            LOIND
          </span>
          <div className="h-3.5 w-px bg-white/15" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">
            Client Portal
          </span>
        </div>

        <div className="flex h-full items-center gap-3.5 border-r border-white/10 px-6">
          <Link
            href="/dashboard"
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            ← 홈으로
          </Link>
          <div className="h-3.5 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className={`${bebasNeue.className} text-base tracking-wider text-white`}>
              {project.name}
            </span>
            <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-blue-300">
              {STATUS_LABEL[project.status]}
            </span>
          </div>
        </div>

        <div className="ml-auto flex h-full items-center gap-2.5 border-l border-white/10 px-5">
          <div className="text-right leading-tight">
            <div className="text-xs font-semibold text-white">
              {currentUser.name ?? currentUser.email}
            </div>
          </div>
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15">
            <span className="text-[11px] font-bold text-emerald-400">
              {(currentUser.name ?? currentUser.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <Link
            href="/dashboard/settings"
            className="hidden cursor-pointer rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white sm:block"
          >
            설정
          </Link>
          <button
            onClick={() => signOut({ redirectTo: "/login" })}
            className="cursor-pointer rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[300px_1fr_260px]">
        {/* LEFT */}
        <div className="flex flex-col overflow-hidden border-white/10 lg:border-r">
          <div className="flex gap-0 border-b border-white/10 px-4.5 pt-3">
            <button
              onClick={() => setLeftTab("brief")}
              className={`cursor-pointer border-b-2 px-1 pb-2.5 text-xs font-semibold transition-all ${
                leftTab === "brief"
                  ? "border-white text-white"
                  : "border-transparent text-white/35 hover:text-white/70"
              }`}
            >
              브리프
            </button>
            <button
              onClick={() => setLeftTab("info")}
              className={`ml-4 cursor-pointer border-b-2 px-1 pb-2.5 text-xs font-semibold transition-all ${
                leftTab === "info"
                  ? "border-white text-white"
                  : "border-transparent text-white/35 hover:text-white/70"
              }`}
            >
              프로젝트 정보
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4.5">
            {leftTab === "brief" ? (
              <div className="flex flex-col gap-4">
                {total > 0 && (
                  <div>
                    <div className="mb-2.5 font-mono text-[9px] uppercase tracking-widest text-white/32">
                      현재 단계
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {project.phases.map((phase, i) => (
                        <div
                          key={i}
                          className={
                            i < current
                              ? "flex items-center gap-2 opacity-40"
                              : i === current
                                ? "flex items-center gap-2 rounded-lg border border-blue-400/22 bg-blue-400/10 px-2.5 py-1.5"
                                : "flex items-center gap-2 opacity-28"
                          }
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              i < current
                                ? "bg-emerald-300"
                                : i === current
                                  ? "animate-pulse bg-blue-400"
                                  : "bg-white/25"
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              i < current
                                ? "text-white/65 line-through"
                                : i === current
                                  ? "font-bold text-white"
                                  : "text-white/50"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}. {phase}
                          </span>
                          {i === current && (
                            <span className="ml-auto font-mono text-[10px] font-bold text-blue-300">
                              {current + 1} / {total}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px bg-white/7" />

                <div>
                  <div className="mb-1.5 flex justify-between font-mono text-[9px] uppercase tracking-widest text-white/32">
                    <span>전체 진행률</span>
                    <span className="text-[13px] font-bold text-blue-300">{progressPct}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-200"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="h-px bg-white/7" />

                <div>
                  <div className="mb-2.5 font-mono text-[9px] uppercase tracking-widest text-white/32">
                    요청사항 현황
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-white/6 bg-black/20 py-2.5 text-center">
                      <div className={`${bebasNeue.className} text-xl text-white/85`}>
                        {project.requests.length}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-white/35">전체</div>
                    </div>
                    <div className="rounded-lg border border-white/6 bg-black/20 py-2.5 text-center">
                      <div className={`${bebasNeue.className} text-xl text-amber-300`}>
                        {reviewCount}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-white/35">검토 중</div>
                    </div>
                    <div className="rounded-lg border border-white/6 bg-black/20 py-2.5 text-center">
                      <div className={`${bebasNeue.className} text-xl text-emerald-300`}>
                        {doneCount}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-white/35">완료</div>
                    </div>
                  </div>
                </div>

                {team.length > 0 && (
                  <>
                    <div className="h-px bg-white/7" />
                    <div>
                      <div className="mb-2.5 font-mono text-[9px] uppercase tracking-widest text-white/32">
                        담당 팀
                      </div>
                      <div className="flex flex-col gap-2">
                        {team.map(({ user, label }) => (
                          <div key={user.id} className="flex items-center gap-2.5">
                            <div
                              className="flex h-7.5 w-7.5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                              style={{ background: colorForId(user.id) }}
                            >
                              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white">
                                {user.name ?? user.email}
                              </div>
                              <div className="font-mono text-[10px] text-white/38">{label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px bg-white/7" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">시작일</div>
                    <div className="text-xs font-semibold text-white/88">{fmtDate(project.startDate)}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">마감일</div>
                    <div className="text-xs font-semibold text-amber-300">{fmtDate(project.endDate)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">회사명</div>
                  <div className="text-xs font-semibold text-white/88">
                    {project.company?.name ?? "-"}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">담당자</div>
                  <div className="text-xs font-semibold text-white/88">
                    {project.company?.contactName ?? "-"}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">이메일</div>
                  <div className="font-mono text-xs text-white/70">
                    {project.company?.contactEmail ?? "-"}
                  </div>
                </div>

                <div className="h-px bg-white/7" />

                {project.brandColors.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                      브랜드 컬러
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {project.brandColors.map((c) => (
                        <div
                          key={c}
                          className="h-5 w-5 rounded border border-white/15"
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                      <span className="font-mono text-[10px] text-white/38">
                        {project.brandColors.join(" · ")}
                      </span>
                    </div>
                  </div>
                )}

                {project.keywords.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">키워드</div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-md border border-white/10 bg-white/6 px-2.5 py-0.5 font-mono text-[10px] text-white/60"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.notes && (
                  <>
                    <div className="h-px bg-white/7" />
                    <div className="flex flex-col gap-1.5">
                      <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">특이사항</div>
                      <div className="rounded-lg border border-white/6 bg-black/20 p-3 text-xs leading-relaxed text-white/55">
                        {project.notes}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MID */}
        <div className="flex flex-col overflow-hidden border-white/10 lg:border-r">
          <div className="flex items-center justify-between border-b border-white/10 px-4.5 py-3.5">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/35">요청사항</div>
              <div className="mt-0.5 text-[11px] text-white/35">
                Staff의 업데이트 및 나의 요청을 확인하세요.
              </div>
            </div>
            <button
              onClick={() => setShowCompose((v) => !v)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/22 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400 transition-all hover:bg-emerald-500/20"
            >
              + 새 요청
            </button>
          </div>

          {showCompose && (
            <div className="animate-fade-up flex flex-col gap-2 border-b border-white/10 bg-emerald-500/[0.03] px-4.5 py-3.5">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/35">
                새 요청사항 작성
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-emerald-400/40"
                placeholder="요청 제목을 입력하세요..."
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className="resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-white outline-none placeholder:text-white/20 focus:border-emerald-400/40"
                placeholder="자세한 내용을 입력하세요..."
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setShowCompose(false)}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] text-white/45 transition-all hover:text-white"
                >
                  취소
                </button>
                <button
                  onClick={submitRequest}
                  disabled={submitting || !body.trim()}
                  className="cursor-pointer rounded-lg border border-emerald-500/32 bg-emerald-500/15 px-4 py-1.5 text-[11px] font-bold text-emerald-400 transition-all hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  전달하기 →
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-2.5 overflow-y-auto p-4.5">
            {project.requests.length === 0 && (
              <div className="py-10 text-center font-mono text-xs text-white/20">
                요청사항이 없습니다.
              </div>
            )}
            {project.requests.map((r) => {
              const badge = requestBadge(r, currentUser.id);
              const isMine = r.author.id === currentUser.id;
              return (
                <div
                  key={r.id}
                  className={`rounded-xl border p-3.5 ${
                    isMine
                      ? "border-emerald-500/15 bg-emerald-500/[0.04]"
                      : "border-white/6 bg-white/5"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ background: colorForId(r.author.id) }}
                      >
                        {(r.author.name ?? r.author.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">
                          {isMine ? `${r.author.name ?? r.author.email} (나)` : r.author.name ?? r.author.email}
                        </span>
                        <span className="ml-1.5 font-mono text-[10px] text-white/35">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  {r.title && (
                    <div className="mb-1 text-[13px] font-bold text-white">{r.title}</div>
                  )}
                  <div className="whitespace-pre-wrap text-xs leading-relaxed text-white/58">
                    {r.body}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="hidden flex-col overflow-hidden lg:flex">
          <div className="border-b border-white/10 px-4 pb-3 pt-3.5">
            <div className="mb-2.5 font-mono text-[9px] uppercase tracking-widest text-white/35">
              결과물 · 파일
            </div>
            <div className="rounded-lg border border-dashed border-white/10 bg-black/15 py-6 text-center font-mono text-[10px] text-white/25">
              아직 등록된 파일이 없습니다.
            </div>
          </div>

          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/35">
                커뮤니케이션 로그
              </div>
              <span className="font-mono text-[9px] text-white/25">열람 전용</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3.5 py-3">
            {project.logs.length === 0 && (
              <div className="py-8 text-center font-mono text-[10px] text-white/20">
                기록이 없습니다.
              </div>
            )}
            {project.logs.map((log) => {
              const meta = LOG_TYPE_META[log.type];
              return (
                <div key={log.id} className="rounded-lg border border-white/6 bg-white/5 p-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] ${meta.cls}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 break-all text-[11px] font-semibold text-white/88">
                        {log.title}
                      </div>
                      {log.body && (
                        <div className="text-[10px] leading-relaxed text-white/45">{log.body}</div>
                      )}
                      <div className="mt-1.5 font-mono text-[9px] text-white/28">
                        {log.author.name ?? log.author.email}
                        {log.logDate && ` · ${fmtDate(log.logDate)}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
