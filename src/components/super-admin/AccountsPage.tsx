"use client";

import { useState } from "react";

import { CreateAccountModal } from "./CreateAccountModal";
import type { AdminUserItem, CompanyItem } from "./types";

function initial(u: AdminUserItem) {
  return (u.name ?? u.email).slice(0, 2).toUpperCase();
}

export function AccountsPage({
  users,
  onUsersChange,
  companies,
  projects,
  showToast,
}: {
  users: AdminUserItem[];
  onUsersChange: (next: AdminUserItem[]) => void;
  companies: CompanyItem[];
  projects: { id: string; name: string }[];
  showToast: (msg: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const staffUsers = users.filter((u) => u.role === "STAFF");
  const pmUsers = users.filter((u) => u.role === "PM");

  const deleteUser = async (id: string, name: string) => {
    if (!window.confirm(`${name} 계정을 삭제할까요?`)) return;
    onUsersChange(users.filter((u) => u.id !== id));
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) showToast(`${name} 계정이 삭제되었습니다.`);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-white">
            계정 관리
          </div>
          <div className="text-xs text-white/40">
            Staff 및 Client 계정을 생성하고 관리합니다.
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="admin-btn-primary"
        >
          + 새 계정 생성
        </button>
      </div>

      <div className="admin-sec-card mb-5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-bold text-white/88">
            Staff 계정
          </div>
          <span className="admin-badge admin-b-staff">
            {staffUsers.length}명
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full border-collapse">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>역할</th>
                <th>담당 프로젝트</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {staffUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-white/30">
                    Staff 계정이 없습니다.
                  </td>
                </tr>
              )}
              {staffUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/12 bg-[#0c0c0e] text-[10px] font-bold">
                        {initial(u)}
                      </div>
                      <span className="font-semibold text-white">
                        {u.name ?? "-"}
                      </span>
                    </div>
                  </td>
                  <td className="font-mono text-white/55">{u.email}</td>
                  <td>
                    <span className="admin-badge admin-b-staff">Staff</span>
                  </td>
                  <td className="text-[11px] text-white/55">
                    {u.projectMemberships.length
                      ? u.projectMemberships
                          .map((m) => m.project.name)
                          .join(", ")
                      : "미배정"}
                  </td>
                  <td>
                    <button
                      onClick={() => deleteUser(u.id, u.name ?? u.email)}
                      className="admin-btn-danger"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-sec-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-bold text-white/88">
            Client 계정
          </div>
          <span className="admin-badge admin-b-client">
            {pmUsers.length}명
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full border-collapse">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>고객사</th>
                <th>배정 프로젝트</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {pmUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-white/30">
                    Client 계정이 없습니다.
                  </td>
                </tr>
              )}
              {pmUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-brand-light/30 bg-brand-light/14 text-[10px] font-bold text-brand-light">
                        {initial(u)}
                      </div>
                      <span className="font-semibold text-white">
                        {u.name ?? "-"}
                      </span>
                    </div>
                  </td>
                  <td className="font-mono text-white/55">{u.email}</td>
                  <td>
                    <span className="rounded-md border border-white/9 bg-white/5 px-2 py-0.5 text-[11px]">
                      {u.company?.name ?? "-"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {u.projectMemberships.length === 0 && (
                        <span className="text-[11px] text-white/30">
                          미배정
                        </span>
                      )}
                      {u.projectMemberships.map((m) => (
                        <span
                          key={m.project.id}
                          className="rounded-full border border-blue-400/22 bg-blue-400/10 px-2.5 py-[3px] font-mono text-[10px] text-blue-300"
                        >
                          {m.project.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteUser(u.id, u.name ?? u.email)}
                      className="admin-btn-danger"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateAccountModal
          companies={companies}
          projects={projects}
          onClose={() => setShowCreate(false)}
          onCreated={(user) => {
            onUsersChange([...users, user]);
            setShowCreate(false);
            showToast(`${user.name} 계정이 생성되었습니다.`);
          }}
        />
      )}
    </div>
  );
}
