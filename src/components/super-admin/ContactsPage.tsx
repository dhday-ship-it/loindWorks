"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import type { ContactRequestItem } from "./types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FIELD_LABEL: Record<string, string> = {
  category: "카테고리",
  purpose: "목적",
  painPoint: "현재 어려움",
  targetAudience: "타겟",
  successCriteria: "성공 기준",
  launchDate: "희망 런칭일",
  budget: "예산",
};

export function ContactsPage({
  contacts,
  onContactsChange,
  showToast,
}: {
  contacts: ContactRequestItem[];
  onContactsChange: (next: ContactRequestItem[]) => void;
  showToast: (msg: string) => void;
}) {
  const [detail, setDetail] = useState<ContactRequestItem | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleHandled = async (contact: ContactRequestItem) => {
    const next = !contact.handled;
    setSaving(true);
    const res = await fetch(`/api/admin/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handled: next }),
    });
    setSaving(false);
    if (res.ok) {
      onContactsChange(
        contacts.map((c) => (c.id === contact.id ? { ...c, handled: next } : c))
      );
      setDetail((prev) => (prev?.id === contact.id ? { ...prev, handled: next } : prev));
      showToast(next ? "문의를 처리 완료로 표시했습니다." : "미처리로 되돌렸습니다.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[22px] font-bold text-white">문의 관리</div>
        <div className="text-xs text-white/40">
          홈페이지 Contact 폼으로 접수된 신규 프로젝트 문의입니다.
        </div>
      </div>

      <div className="admin-sec-card p-6">
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full border-collapse">
            <thead>
              <tr>
                <th>기업명</th>
                <th>담당자</th>
                <th>연락처</th>
                <th>이메일</th>
                <th>문의 건수</th>
                <th>접수일</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-white/30">
                    접수된 문의가 없습니다.
                  </td>
                </tr>
              )}
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold text-white">{c.companyName}</td>
                  <td>{c.contactName}</td>
                  <td className="font-mono text-[11px] text-white/60">{c.phone}</td>
                  <td className="font-mono text-[11px] text-white/60">{c.email}</td>
                  <td>{c.projects.length}건</td>
                  <td className="font-mono text-[11px] text-white/50">
                    {fmtDate(c.createdAt)}
                  </td>
                  <td>
                    <span
                      className={
                        c.handled
                          ? "admin-badge admin-b-done"
                          : "admin-badge admin-b-pending"
                      }
                    >
                      {c.handled ? "처리 완료" : "미처리"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setDetail(c)}
                        className="admin-btn-ghost"
                      >
                        상세보기
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <Modal
          title={detail.companyName}
          subtitle={`${detail.contactName} · ${fmtDate(detail.createdAt)} 접수`}
          onClose={() => setDetail(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/8 bg-black/20 p-3.5 text-xs">
              <div>
                <div className="font-mono text-[9px] uppercase text-white/30">연락처</div>
                <div className="mt-0.5 font-mono text-white/80">{detail.phone}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase text-white/30">이메일</div>
                <div className="mt-0.5 font-mono text-white/80">{detail.email}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {detail.projects.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/8 bg-white/5 p-3.5"
                >
                  <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-light">
                    문의 {i + 1} · {p.category || "카테고리 미선택"}
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs">
                    {(
                      [
                        "purpose",
                        "painPoint",
                        "targetAudience",
                        "successCriteria",
                        "launchDate",
                        "budget",
                      ] as const
                    ).map((key) =>
                      p[key] ? (
                        <div key={key} className="flex gap-2">
                          <span className="w-20 shrink-0 text-white/35">
                            {FIELD_LABEL[key]}
                          </span>
                          <span className="text-white/80">{p[key]}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => toggleHandled(detail)}
              disabled={saving}
              className={
                detail.handled
                  ? "admin-btn-ghost w-full"
                  : "admin-btn-primary w-full"
              }
            >
              {detail.handled ? "미처리로 되돌리기" : "처리 완료로 표시"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
