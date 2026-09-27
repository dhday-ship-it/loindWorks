"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { Icon, type IconName } from "@/components/ui/Icon";
import { OverviewPage } from "./OverviewPage";
import { AccountsPage } from "./AccountsPage";
import { CompaniesPage } from "./CompaniesPage";
import { ProjectsAdminPage } from "./ProjectsAdminPage";
import { ProjectRecordsPage } from "./ProjectRecordsPage";
import { CorporateLedgerPage } from "./CorporateLedgerPage";
import { LoanAdvancePage } from "./LoanAdvancePage";
import { BannersPage } from "./BannersPage";
import { LoginImagePage } from "./LoginImagePage";
import { ArtisanPage } from "./ArtisanPage";
import { ArtisanWorksPage } from "./ArtisanWorksPage";
import { ArtisanAdSlotPage } from "./ArtisanAdSlotPage";
import { ArtisanOrdersPage } from "./ArtisanOrdersPage";
import type {
  AdminProjectItem,
  AdminStats,
  AdminUserItem,
  CompanyItem,
  StaffOption,
} from "./types";

type Page =
  | "dashboard"
  | "accounts"
  | "companies"
  | "projects"
  | "records"
  | "ledger"
  | "loans"
  | "banners"
  | "loginImage"
  | "artisan"
  | "artisanWorks"
  | "artisanOrders"
  | "artisanAdSlot";

export function SuperAdminDashboard({
  currentUserName,
  stats,
  inProgressProjects,
}: {
  currentUserName: string;
  stats: AdminStats;
  inProgressProjects: AdminProjectItem[];
}) {
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
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

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const navItems: { id: Page; label: string; icon: IconName; section?: string }[] =
    [
      { id: "dashboard", label: "대시보드", icon: "chart" },
      { id: "accounts", label: "계정 목록", icon: "users", section: "계정 관리" },
      { id: "companies", label: "고객사 목록", icon: "building", section: "고객사 관리" },
      { id: "projects", label: "Works 목록", icon: "folder", section: "Works 관리" },
      { id: "records", label: "프로젝트 장부", icon: "receipt", section: "기록 관리" },
      { id: "ledger", label: "법인 지출 기록부", icon: "wallet" },
      { id: "loans", label: "대출·가지급금 관리", icon: "landmark" },
      { id: "banners", label: "배너 관리", icon: "image", section: "화면 관리" },
      { id: "loginImage", label: "로그인 화면", icon: "lock", section: "화면 관리" },
      { id: "artisan", label: "아티즌", icon: "image", section: "아티즌" },
      { id: "artisanOrders", label: "의뢰 접수함", icon: "mail", section: "아티즌" },
      { id: "artisanWorks", label: "의뢰 타입 관리", icon: "folder", section: "아티즌" },
      { id: "artisanAdSlot", label: "광고 배너", icon: "image", section: "아티즌" },
    ];

  // 연속으로 같은 section인 항목끼리 묶는다 (섹션 헤더가 항목마다 중복 렌더되는 걸 방지).
  const navGroups: { section: string | null; items: typeof navItems }[] = [];
  for (const item of navItems) {
    const key = item.section ?? null;
    const last = navGroups[navGroups.length - 1];
    if (last && last.section === key) {
      last.items.push(item);
    } else {
      navGroups.push({ section: key, items: [item] });
    }
  }

  return (
    <div
      className="light-ui font-[family-name:var(--font-dm-sans)] relative flex h-screen w-full flex-col overflow-hidden p-5"
      style={{
        background: "linear-gradient(135deg, #f6f8fa 0%, #ebeff4 50%, #ccd2e1 100%)",
      }}
    >
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-sm shadow-brand/5">
        <div className="flex h-[54px] shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3.5">
            <span
              className="font-[family-name:var(--font-quicksand)] text-xl font-bold tracking-tight text-slate-800"
            >
              LOIND
            </span>
            <div className="h-3.5 w-px bg-slate-200" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">{currentUserName}</span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            >
              워크스테이션으로
            </Link>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-[220px] shrink-0 flex-col overflow-hidden overflow-y-auto border-r border-slate-100">
            <div className="px-3.5 pb-2 pt-4.5 text-[11px] font-bold text-slate-500">
              메뉴
            </div>
            {navGroups.map((group, gi) => {
              const rows = group.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => switchPage(item.id)}
                  className={`admin-sb-item ${page === item.id ? "active" : ""}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                      page === item.id
                        ? "bg-brand text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon name={item.icon} className="h-3.5 w-3.5" />
                  </span>
                  {item.label}
                  {item.id === "dashboard" && (
                    <span className="ml-auto rounded-full border border-brand-light/30 bg-brand-light/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-brand-light">
                      Live
                    </span>
                  )}
                </div>
              ));

              if (!group.section) return <div key={gi}>{rows}</div>;

              const collapsed = collapsedSections[group.section];
              return (
                <div key={group.section}>
                  <button
                    type="button"
                    onClick={() => toggleSection(group.section!)}
                    className="flex w-full cursor-pointer items-center justify-between px-3.5 pb-2 pt-5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    <span>{group.section}</span>
                    <Icon
                      name="chevronDown"
                      className={`h-2.5 w-2.5 transition-transform ${collapsed ? "-rotate-90" : ""}`}
                    />
                  </button>
                  {!collapsed && rows}
                </div>
              );
            })}
          </div>

          <div className="min-w-0 flex-1 overflow-y-auto px-8 py-7">
            {page === "dashboard" && (
              <OverviewPage
                stats={stats}
                inProgressProjects={inProgressProjects}
                onNavigateProjects={() => switchPage("projects")}
              />
            )}
            {page === "accounts" && (
              users ? (
                <AccountsPage
                  users={users}
                  onUsersChange={setUsers}
                  showToast={handleShowToast}
                />
              ) : tabLoading ? (
                <div className="flex items-center justify-center py-20 text-sm text-slate-400">
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
                <div className="flex items-center justify-center py-20 text-sm text-slate-400">
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
                <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                  불러오는 중...
                </div>
              ) : null
            )}
            {page === "records" && (
              projects ? (
                <ProjectRecordsPage projects={projects} showToast={handleShowToast} />
              ) : tabLoading ? (
                <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                  불러오는 중...
                </div>
              ) : null
            )}
            {page === "ledger" && (
              <CorporateLedgerPage showToast={handleShowToast} />
            )}
            {page === "loans" && (
              <LoanAdvancePage showToast={handleShowToast} />
            )}
            {page === "banners" && (
              <BannersPage showToast={handleShowToast} />
            )}
            {page === "artisan" && (
              <ArtisanPage showToast={handleShowToast} />
            )}
            {page === "artisanOrders" && (
              <ArtisanOrdersPage showToast={handleShowToast} />
            )}
            {page === "artisanWorks" && (
              <ArtisanWorksPage showToast={handleShowToast} />
            )}
            {page === "artisanAdSlot" && (
              <ArtisanAdSlotPage showToast={handleShowToast} />
            )}
            {page === "loginImage" && (
              <LoginImagePage showToast={handleShowToast} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
