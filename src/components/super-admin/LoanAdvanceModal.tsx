"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import type { LoanAdvanceType } from "@/generated/prisma/enums";
import type { LoanAdvanceEntryItem } from "./types";

const TYPE_LABEL: Record<LoanAdvanceType, string> = {
  LOAN: "대출",
  ADVANCE: "가지급금",
};

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function LoanAdvanceModal({
  entry,
  onClose,
  onSaved,
  onDeleted,
}: {
  entry: LoanAdvanceEntryItem | null;
  onClose: () => void;
  onSaved: (entry: LoanAdvanceEntryItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [date, setDate] = useState(
    entry ? toDateInput(entry.date) : new Date().toISOString().slice(0, 10)
  );
  const [type, setType] = useState<LoanAdvanceType>(entry?.type ?? "ADVANCE");
  const [counterparty, setCounterparty] = useState(entry?.counterparty ?? "");
  const [amount, setAmount] = useState(entry?.amount.toString() ?? "");
  const [repaid, setRepaid] = useState(entry?.repaid.toString() ?? "0");
  const [note, setNote] = useState(entry?.note ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outstanding =
    Number.isFinite(Number(amount)) && Number.isFinite(Number(repaid))
      ? Number(amount || 0) - Number(repaid || 0)
      : null;

  const save = async () => {
    if (!counterparty.trim() || !date) {
      setError("날짜와 성명/거래처는 필수입니다.");
      return;
    }
    if (!amount || !Number.isFinite(Number(amount))) {
      setError("지급액을 입력해주세요.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload = { date, type, counterparty, amount, repaid, note: note || null };

    const res = entry
      ? await fetch(`/api/admin/loan-advances/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/loan-advances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "저장에 실패했습니다.");
      return;
    }

    const { entry: saved } = await res.json();
    onSaved(saved);
  };

  const remove = async () => {
    if (!entry) return;
    if (
      !window.confirm(
        `"${entry.counterparty}" 기록을 삭제할까요? 되돌릴 수 없습니다.`
      )
    )
      return;
    setSaving(true);
    const res = await fetch(`/api/admin/loan-advances/${entry.id}`, {
      method: "DELETE",
    });
    setSaving(false);
    if (res.ok) onDeleted(entry.id);
  };

  return (
    <Modal
      title={entry ? "기록 수정" : "새 기록 추가"}
      subtitle="대출·가지급금의 지급 및 회수 내역을 기록합니다."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              일자
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              구분
            </span>
            <div className="flex gap-1.5">
              {(["LOAN", "ADVANCE"] as LoanAdvanceType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                    type === t
                      ? "border-brand-light/40 bg-brand-light/15 text-brand-light"
                      : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            성명/거래처
          </span>
          <input
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            className="admin-input"
            placeholder="예: 홍길동 이사"
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              지급액 (원)
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="admin-input"
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              회수(상환)액 (원)
            </span>
            <input
              type="number"
              value={repaid}
              onChange={(e) => setRepaid(e.target.value)}
              className="admin-input"
              placeholder="0"
            />
          </div>
        </div>

        {outstanding !== null && (
          <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[11px]">
            <span className="text-white/40">미납잔액 </span>
            <span
              className={`font-bold ${outstanding > 0 ? "text-amber-300" : "text-white/70"}`}
            >
              {outstanding.toLocaleString("ko-KR")}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            비고
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="admin-input"
            placeholder="선택 사항"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          {entry ? (
            <button
              onClick={remove}
              disabled={saving}
              className="admin-btn-danger disabled:opacity-50"
            >
              삭제
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="admin-btn-ghost">
              취소
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="admin-btn-primary disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
