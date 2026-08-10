"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import type { CompanyItem } from "./types";

export function CreateCompanyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (company: CompanyItem) => void;
}) {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!name.trim() || !companyId.trim()) {
      setError("회사명과 Company ID는 필수입니다.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, companyId, contactName, contactEmail }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "고객사 등록에 실패했습니다.");
      return;
    }

    const { company } = await res.json();
    onCreated(company);
  };

  return (
    <Modal
      title="고객사 등록"
      subtitle="고객사 Company ID와 기본 정보를 등록합니다."
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
              placeholder="주식회사 OOO"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              Company ID
            </span>
            <input
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="admin-input"
              placeholder="예: aheba"
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
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
