"use client";

import { useState } from "react";
import Link from "next/link";
import { ParticleBackground } from "@/components/ParticleBackground";
import { UserMenu } from "@/components/nav/UserMenu";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { OverviewPage } from "./OverviewPage";
import { AccountsPage } from "./AccountsPage";
import { CompaniesPage } from "./CompaniesPage";
import { ProjectsAdminPage } from "./ProjectsAdminPage";
import { ProjectRecordsPage } from "./ProjectRecordsPage";
import type {
  AdminProjectItem,
  AdminStats,
  AdminUserItem,
  CompanyItem,
  StaffOption,
  UnhandledRequestItem,
} from "./types";

type Page =
  | "dashboard"
  | "accounts"
  | "companies"
  | "projects"
  | "records";

export function SuperAdminDashboard({
  currentUserName,
  stats,
  inProgressProjects,
  unhandledRequests,
}: {
  currentUserName: string;
  stats: AdminStats;
  inProgressProjects: AdminProjectItem[];
  unhandledRequests: UnhandledRequestItem[];
}) {
  const [page, setPage] = useState<Page>("dashboard");
  const [users, setUsers] = useState<AdminUserItem[] | null>(null);
  const [companies, setCompanies] = useState<CompanyItem[] | null>(null);
  const [projects, setProjects] = useState<AdminProjectItem[] | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const { toasts, show: showToast, dismiss } = useToast();

  const switchPage = async (target: Page) => {
    setPage(target);

    if (target === "accounts" && !users) {
      setTabLoading(true);
      const res = await fetch("/api/admin/accounts");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
      setTabLoading(false);
    }
    if (target === "companies" && !companies) {
      setTabLoading(true);
      const res = await fetch("/api/admin/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies);
      }
      setTabLoading(false);
    }
    if (target === "projects" && !projects) {
      setTabLoading(true);
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
        setStaff(data.staff);
      }
      setTabLoading(false);
    }
    if (target === "records" && !projects) {
      setTabLoading(true);
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
        setStaff(data.staff);
      }
      setTabLoading(false);
    }
  };

  const handleShowToast = (msg: string) => {
    showToast(msg, "success");
  };

  const navItems: { id: Page; label: string; icon: string; section?: string }[] =
    [
      { id: "dashboard", label: "대시보드", icon: "📈" },
      { id: "accounts", label: "계정 목록", icon: "👥", section: "계정 관리" },
      { id: "companies", label: "고객사 목록", icon: "🏢", section: "고객사 관리" },
      { id: "projects", label: "프로젝트 목록", icon: "📁", section: "프로젝트 관리" },
      { id: "records", label: "프로젝트 기록", icon: "🧾", section: "기록 관리" },
    ];

  return (
    <div
      className="font-[family-name:var(--font-dm-sans)] relative flex h-screen flex-col overflow-hidden text-white"
    >
      <ParticleBackground />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div className="relative z-10 flex h-screen flex-col overflow-hidden">
        <div className="flex h-[54px] shrink-0 items-center justify-between border-b border-white/9 bg-[rgba(6,8,10,0.78)] px-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3.5">
            <span
              className="font-[family-name:var(--font-quicksand)] text-xl font-bold tracking-tight text-white"
            >
              LOIND
            </span>
            <div className="h-3.5 w-px bg-white/18" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              워크스테이션으로
            </Link>
            <UserMenu name={currentUserName} roleLabel="최고관리자" />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-[220px] shrink-0 flex-col overflow-hidden border-r border-white/8 bg-[rgba(6,8,10,0.65)] backdrop-blur-2xl">
            <div className="px-3.5 pb-2 pt-4.5 text-[11px] font-bold text-white/45">
              메뉴
            </div>
            {navItems.map((item, i) => (
              <div key={item.id}>
                {item.section && (
                  <div className="px-3.5 pb-2 pt-5 font-mono text-[9px] font-bold uppercase tracking-wider text-white/28">
                    {item.section}
                  </div>
                )}
                <div
                  onClick={() => switchPage(item.id)}
                  className={`admin-sb-item ${page === item.id ? "active" : ""}`}
                >
                  <span className="w-4 text-center text-[13px]">
                    {item.icon}
                  </span>
                  {item.label}
                  {i === 0 && (
                    <span className="ml-auto rounded-full border border-brand-light/30 bg-brand-light/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-brand-light">
                      Live
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-7">
            {page === "dashboard" && (
              <OverviewPage
                stats={stats}
                inProgressProjects={inProgressProjects}
                unhandledRequests={unhandledRequests}
                onNavigateProjects={() => switchPage("projects")}
              />
            )}
            {page === "accounts" && (
              users ? (
                <AccountsPage
                  users={users}
                  onUsersChange={setUsers}
                  companies={companies ?? []}
                  projects={(projects ?? []).map((p) => ({ id: p.id, name: p.name }))}
                  showToast={handleShowToast}
                />
              ) : tabLoading ? (
                <div className="flex items-center justify-center py-20 text-sm text-white/30">
                  불러오는 중...
                </div>
              ) : null
            )}
            {page === "companies" && (
              companies ? (
                <CompaniesPage
                  companies={companies}
                  onCompaniesChange={setCompanies}
                  showToast={handleShowToast}
                />
              ) : tabLoading ? (
                <div className="flex items-center justify-center py-20 text-sm text-white/30">
                  불러오는 중...
                </div>
              ) : null
            )}
            {page === "projects" && (
              projects ? (
                <ProjectsAdminPage
                  projects={projects}
                  onProjectsChange={setProjects}
                  companies={companies ?? []}
                  staff={staff}
                  showToast={handleShowToast}
                />
              ) : tabLoading ? (
                <div className="flex items-center justify-center py-20 text-sm text-white/30">
                  불러오는 중...
                </div>
              ) : null
            )}
            {page === "records" && (
              projects ? (
                <ProjectRecordsPage projects={projects} showToast={handleShowToast} />
              ) : tabLoading ? (
                <div className="flex items-center justify-center py-20 text-sm text-white/30">
                  불러오는 중...
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
