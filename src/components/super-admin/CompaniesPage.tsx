"use client";

import { useState } from "react";

import { CreateCompanyModal } from "./CreateCompanyModal";
import type { CompanyItem } from "./types";

export function CompaniesPage({
  companies,
  onCompaniesChange,
  showToast,
}: {
  companies: CompanyItem[];
  onCompaniesChange: (next: CompanyItem[]) => void;
  showToast: (msg: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);

  const deleteCompany = async (id: string, name: string) => {
    if (
      !window.confirm(
        `${name}를 삭제할까요? 연결된 계정/프로젝트의 소속 정보도 함께 해제됩니다.`
      )
    )
      return;
    onCompaniesChange(companies.filter((c) => c.id !== id));
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "DELETE",
    });
    if (res.ok) showToast(`${name}가 삭제되었습니다.`);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-white">
            고객사 관리
          </div>
          <div className="text-xs text-white/40">
            고객사 정보 및 Company ID를 관리합니다.
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="admin-btn-primary"
        >
          + 고객사 등록
        </button>
      </div>

      <div className="admin-sec-card p-6">
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full border-collapse">
            <thead>
              <tr>
                <th>회사명</th>
                <th>Company ID</th>
                <th>담당자</th>
                <th>이메일</th>
                <th>연결 프로젝트</th>
                <th>계정 수</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-white/30">
                    등록된 고객사가 없습니다.
                  </td>
                </tr>
              )}
              {companies.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold text-white">{c.name}</td>
                  <td className="font-mono text-white/55">{c.companyId}</td>
                  <td>{c.contactName ?? "-"}</td>
                  <td className="font-mono text-[11px] text-white/50">
                    {c.contactEmail ?? "-"}
                  </td>
                  <td className="text-[11px] text-white/55">
                    {c._count.projects}개
                  </td>
                  <td>
                    <span className="admin-badge admin-b-client">
                      {c._count.users}명
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteCompany(c.id, c.name)}
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
        <CreateCompanyModal
          onClose={() => setShowCreate(false)}
          onCreated={(company) => {
            onCompaniesChange([...companies, company]);
            setShowCreate(false);
            showToast(`${company.name} 고객사가 등록되었습니다.`);
          }}
        />
      )}
    </div>
  );
}
