"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import type { CompanyItem } from "./types";

export function EditCompanyModal({
  company,
  onClose,
  onSaved,
}: {
  company: CompanyItem;
  onClose: () => void;
  onSaved: (company: CompanyItem) => void;
}) {
  const [name, setName] = useState(company.name);
  const [contactName, setContactName] = useState(company.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(company.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(company.contactPhone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError("회사명을 입력해주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/admin/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contactName, contactEmail, contactPhone }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "수정에 실패했습니다.");
      return;
    }

    const { company: updated } = await res.json();
    onSaved(updated);
  };

  return (
    <Modal
      title="고객사 수정"
      subtitle="고객사 정보를 수정합니다."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              회사명
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              Company ID
            </span>
            <input
              value={company.companyId}
              disabled
              className="admin-input opacity-40"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            담당자 이름
          </span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="admin-input"
            placeholder="홍길동 대리"
          />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              담당자 이메일
            </span>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="admin-input"
              placeholder="contact@company.kr"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              담당자 연락처
            </span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="admin-input"
              placeholder="010-1234-5678"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="mt-1.5 flex justify-end gap-2 border-t border-white/8 pt-4">
          <button onClick={onClose} className="admin-btn-ghost">
            취소
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="admin-btn-primary disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
