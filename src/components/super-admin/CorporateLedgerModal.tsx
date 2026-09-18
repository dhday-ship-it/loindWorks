"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import type { CorporateLedgerEntryItem } from "./types";

type EntryType = "INCOME" | "EXPENSE";

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function CorporateLedgerModal({
  entry,
  previousBalance,
  onClose,
  onSaved,
  onDeleted,
}: {
  entry: CorporateLedgerEntryItem | null;
  previousBalance: number;
  onClose: () => void;
  onSaved: (entry: CorporateLedgerEntryItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [date, setDate] = useState(
    entry ? toDateInput(entry.date) : new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState(entry?.description ?? "");
  const [entryType, setEntryType] = useState<EntryType>(
    entry && entry.expense !== null ? "EXPENSE" : "INCOME"
  );
  const [amount, setAmount] = useState(
    entry ? String(entry.income ?? entry.expense ?? "") : ""
  );
  const [balance, setBalance] = useState(
    entry ? String(entry.balance) : ""
  );
  const [balanceTouched, setBalanceTouched] = useState(!!entry);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyAmount = (v: string) => {
    setAmount(v);
    if (balanceTouched) return;
    const n = Number(v);
    if (!v || !Number.isFinite(n)) return;
    const suggested = entryType === "INCOME" ? previousBalance + n : previousBalance - n;
    setBalance(String(suggested));
  };

  const applyType = (t: EntryType) => {
    setEntryType(t);
    if (balanceTouched) return;
    const n = Number(amount);
    if (!amount || !Number.isFinite(n)) return;
    const suggested = t === "INCOME" ? previousBalance + n : previousBalance - n;
    setBalance(String(suggested));
  };

  const save = async () => {
    if (!description.trim() || !date) {
      setError("날짜와 적요는 필수입니다.");
      return;
    }
    if (!amount || !Number.isFinite(Number(amount))) {
      setError("금액을 입력해주세요.");
      return;
    }
    if (balance === "" || !Number.isFinite(Number(balance))) {
      setError("잔액을 입력해주세요.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      date,
      description,
      income: entryType === "INCOME" ? amount : null,
      expense: entryType === "EXPENSE" ? amount : null,
      balance,
    };

    const res = entry
      ? await fetch(`/api/admin/corporate-ledger/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/corporate-ledger", {
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
    if (!window.confirm(`"${entry.description}" 기록을 삭제할까요? 되돌릴 수 없습니다.`))
      return;
    setSaving(true);
    const res = await fetch(`/api/admin/corporate-ledger/${entry.id}`, {
      method: "DELETE",
    });
    setSaving(false);
    if (res.ok) onDeleted(entry.id);
  };

  return (
    <Modal
      title={entry ? "기록 수정" : "새 기록 추가"}
      subtitle="법인 자금의 수입·지출 내역을 기록합니다."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              년월일
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              구분
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => applyType("INCOME")}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                  entryType === "INCOME"
                    ? "border-brand-light/40 bg-brand-light/15 text-brand-light"
                    : "border-slate-100 bg-slate-50 text-slate-500 hover:text-slate-800"
                }`}
              >
                수입
              </button>
              <button
                type="button"
                onClick={() => applyType("EXPENSE")}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                  entryType === "EXPENSE"
                    ? "border-amber-300/40 bg-amber-300/15 text-amber-300"
                    : "border-slate-100 bg-slate-50 text-slate-500 hover:text-slate-800"
                }`}
              >
                지출
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            적요
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="admin-input"
            placeholder="예: 8월 사무실 임대료 지급"
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              {entryType === "INCOME" ? "수입금액" : "지출금액"} (원)
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => applyAmount(e.target.value)}
              className="admin-input"
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              잔액 (원)
            </span>
            <input
              type="number"
              value={balance}
              onChange={(e) => {
                setBalanceTouched(true);
                setBalance(e.target.value);
              }}
              className="admin-input"
              placeholder="0"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
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
