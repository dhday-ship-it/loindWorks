"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import { ParticleBackground } from "@/components/ParticleBackground";
import { OverviewPage } from "./OverviewPage";
import { AccountsPage } from "./AccountsPage";
import { CompaniesPage } from "./CompaniesPage";
import { ProjectsAdminPage } from "./ProjectsAdminPage";
import { ContactsPage } from "./ContactsPage";
import { Toast } from "./Toast";
import type {
  AdminProjectItem,
  AdminStats,
  AdminUserItem,
  CompanyItem,
  ContactRequestItem,
  StaffOption,
  UnhandledRequestItem,
} from "./types";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

type Page = "dashboard" | "accounts" | "companies" | "projects" | "contacts";

export function SuperAdminDashboard({
  currentUserName,
  stats,
  inProgressProjects,
  unhandledRequests,
  initialUsers,
  initialCompanies,
  initialProjects,
  initialContacts,
  staff,
}: {
  currentUserName: string;
  stats: AdminStats;
  inProgressProjects: AdminProjectItem[];
  unhandledRequests: UnhandledRequestItem[];
  initialUsers: AdminUserItem[];
  initialCompanies: CompanyItem[];
  initialProjects: AdminProjectItem[];
  initialContacts: ContactRequestItem[];
  staff: StaffOption[];
}) {
  const [page, setPage] = useState<Page>("dashboard");
  const [users, setUsers] = useState(initialUsers);
  const [companies, setCompanies] = useState(initialCompanies);
  const [projects, setProjects] = useState(initialProjects);
  const [contacts, setContacts] = useState(initialContacts);
  const [toast, setToast] = useState<string | null>(null);
  const unhandledContacts = contacts.filter((c) => !c.handled).length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const navItems: { id: Page; label: string; icon: string; section?: string }[] =
    [
      { id: "dashboard", label: "대시보드", icon: "📈" },
      { id: "contacts", label: "문의 목록", icon: "📮", section: "문의 관리" },
      { id: "accounts", label: "계정 목록", icon: "👥", section: "계정 관리" },
      { id: "companies", label: "고객사 목록", icon: "🏢", section: "고객사 관리" },
      { id: "projects", label: "프로젝트 목록", icon: "📁", section: "프로젝트 관리" },
    ];

  return (
    <div
      className={`${dmSans.className} flex h-screen flex-col overflow-hidden text-white`}
    >
      <ParticleBackground />
      <Toast message={toast} />

      <div className="flex h-[54px] shrink-0 items-center justify-between border-b border-white/9 bg-[rgba(6,8,10,0.78)] px-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <span
            className={`${bebasNeue.className} text-xl tracking-widest text-white`}
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
            className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white"
          >
            워크스테이션으로
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white"
          >
            설정
          </Link>
          <div className="flex items-center gap-2.5 border-l border-white/9 pl-4">
            <div className="text-right leading-[1.35]">
              <div className="text-xs font-semibold text-white">
                {currentUserName}
              </div>
              <div className="font-mono text-[9px] text-white/38">
                super_admin
              </div>
            </div>
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-purple-300/36 bg-purple-300/16">
              <span className="text-[11px] font-bold text-purple-300">
                {currentUserName.slice(0, 1)}
              </span>
            </div>
          </div>
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
                onClick={() => setPage(item.id)}
                className={`admin-sb-item ${page === item.id ? "active" : ""}`}
              >
                <span className="w-4 text-center text-[13px]">
                  {item.icon}
                </span>
                {item.label}
                {i === 0 && (
                  <span className="ml-auto rounded-full border border-emerald-400/25 bg-emerald-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                    Live
                  </span>
                )}
                {item.id === "contacts" && unhandledContacts > 0 && (
                  <span className="ml-auto rounded-full border border-amber-400/25 bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400">
                    {unhandledContacts}
                  </span>
                )}
              </div>
            </div>
          ))}

          <div className="mt-auto border-t border-white/7 p-3.5">
            <button
              onClick={() => signOut({ redirectTo: "/login" })}
              className="w-full cursor-pointer rounded-lg border border-red-400/18 bg-red-400/8 py-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-400/16"
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          {page === "dashboard" && (
            <OverviewPage
              stats={stats}
              inProgressProjects={inProgressProjects}
              unhandledRequests={unhandledRequests}
              unhandledContacts={unhandledContacts}
              onNavigateProjects={() => setPage("projects")}
              onNavigateContacts={() => setPage("contacts")}
            />
          )}
          {page === "contacts" && (
            <ContactsPage
              contacts={contacts}
              onContactsChange={setContacts}
              showToast={showToast}
            />
          )}
          {page === "accounts" && (
            <AccountsPage
              users={users}
              onUsersChange={setUsers}
              companies={companies}
              projects={projects.map((p) => ({ id: p.id, name: p.name }))}
              showToast={showToast}
            />
          )}
          {page === "companies" && (
            <CompaniesPage
              companies={companies}
              onCompaniesChange={setCompanies}
              showToast={showToast}
            />
          )}
          {page === "projects" && (
            <ProjectsAdminPage
              projects={projects}
              onProjectsChange={setProjects}
              companies={companies}
              staff={staff}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
}
