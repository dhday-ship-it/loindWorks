"use client";

import { useState } from "react";

import { CreateAccountModal } from "./CreateAccountModal";
import type { AdminUserItem } from "./types";

function initial(u: AdminUserItem) {
  return (u.name ?? u.email).slice(0, 2).toUpperCase();
}

export function AccountsPage({
  users,
  onUsersChange,
  showToast,
}: {
  users: AdminUserItem[];
  onUsersChange: (next: AdminUserItem[]) => void;
  showToast: (msg: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const pmUsers = users.filter((u) => u.role === "PM");
  const staffUsers = users.filter((u) => u.role === "STAFF");

  const deleteUser = async (id: string, name: string) => {
    if (!window.confirm(`${name} 계정을 삭제할까요?`)) return;
    onUsersChange(users.filter((u) => u.id !== id));
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) showToast(`${name} 계정이 삭제되었습니다.`);
  };

  const renderTable = (
    list: AdminUserItem[],
    badgeClass: string,
    badgeLabel: string,
    emptyLabel: string
  ) => (
    <div className="overflow-x-auto">
      <table className="admin-tbl w-full border-collapse">
        <thead>
          <tr>
            <th>이름</th>
            <th>이메일</th>
            <th>역할</th>
            <th>배정 Works</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-400">
                {emptyLabel}
              </td>
            </tr>
          )}
          {list.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="flex items-center gap-2">
                  <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-[10px] font-bold text-indigo-500">
                    {initial(u)}
                  </div>
                  <span className="font-semibold text-slate-800">
                    {u.name ?? "-"}
                  </span>
                </div>
              </td>
              <td className="font-mono text-slate-600">{u.email}</td>
              <td>
                <span className={`admin-badge ${badgeClass}`}>{badgeLabel}</span>
              </td>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  {u.projectMemberships.length === 0 && (
                    <span className="text-[11px] text-slate-400">미배정</span>
                  )}
                  {u.projectMemberships.map((m) => (
                    <span
                      key={m.project.id}
                      className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-[3px] font-mono text-[10px] text-indigo-500"
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
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-slate-800">
            계정 관리
          </div>
          <div className="text-xs text-slate-500">
            PM 및 Creator 계정을 생성하고 관리합니다.
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
          <div className="text-[13px] font-bold text-slate-800">PM 계정</div>
          <span className="admin-badge admin-b-pm">{pmUsers.length}명</span>
        </div>
        {renderTable(pmUsers, "admin-b-pm", "PM", "PM 계정이 없습니다.")}
      </div>

      <div className="admin-sec-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-bold text-slate-800">Creator 계정</div>
          <span className="admin-badge admin-b-staff">{staffUsers.length}명</span>
        </div>
        {renderTable(staffUsers, "admin-b-staff", "Creator", "Creator 계정이 없습니다.")}
      </div>

      {showCreate && (
        <CreateAccountModal
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
