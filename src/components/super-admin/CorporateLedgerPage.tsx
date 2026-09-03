"use client";

import { useEffect, useMemo, useState } from "react";

import { CorporateLedgerModal } from "./CorporateLedgerModal";
import type { CorporateLedgerEntryItem } from "./types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtWon(n: number | null) {
  if (n === null) return "-";
  return n.toLocaleString("ko-KR");
}

export function CorporateLedgerPage({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [entries, setEntries] = useState<CorporateLedgerEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CorporateLedgerEntryItem | "new" | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/corporate-ledger")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setLoading(false);
        if (data) setEntries(data.entries);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of entries) {
      income += e.income ?? 0;
      expense += e.expense ?? 0;
    }
    const balance = entries.length > 0 ? entries[entries.length - 1].balance : 0;
    return { income, expense, balance };
  }, [entries]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-white">
            법인 지출 기록부
          </div>
          <div className="text-xs text-white/40">
            법인 자금의 수입·지출 내역을 날짜순으로 기록하고 잔액을 관리합니다.
          </div>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="admin-btn-primary"
        >
          + 기록 추가
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3.5">
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            수입 합계
          </div>
          <div className="my-1 text-2xl tracking-wide text-brand-light">
            {fmtWon(summary.income)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            지출 합계
          </div>
          <div className="my-1 text-2xl tracking-wide text-amber-300">
            {fmtWon(summary.expense)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            현재 잔액
          </div>
          <div className="my-1 text-2xl tracking-wide text-white">
            {fmtWon(summary.balance)}
          </div>
        </div>
      </div>

      <div className="admin-sec-card p-6">
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className="whitespace-nowrap">년월일</th>
                <th className="whitespace-nowrap">적요</th>
                <th className="whitespace-nowrap">수입금액</th>
                <th className="whitespace-nowrap">지출금액</th>
                <th className="whitespace-nowrap">잔액</th>
                <th className="whitespace-nowrap">작성자</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-white/30">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-white/30">
                    기록이 없습니다.
                  </td>
                </tr>
              )}
              {!loading &&
                entries.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setEditing(e)}
                    className="cursor-pointer"
                  >
                    <td className="whitespace-nowrap font-mono text-[11px] text-white/50">
                      {fmtDate(e.date)}
                    </td>
                    <td className="min-w-[200px] font-semibold text-white">
                      {e.description}
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px] text-brand-light">
                      {fmtWon(e.income)}
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px] text-amber-300">
                      {fmtWon(e.expense)}
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px] font-bold text-white">
                      {fmtWon(e.balance)}
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-white/50">
                      {e.author.name ?? e.author.email}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <CorporateLedgerModal
          entry={editing === "new" ? null : editing}
          previousBalance={
            entries.length > 0 ? entries[entries.length - 1].balance : 0
          }
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEntries((prev) => {
              const exists = prev.some((e) => e.id === saved.id);
              const next = exists
                ? prev.map((e) => (e.id === saved.id ? saved : e))
                : [...prev, saved];
              return next.sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );
            });
            setEditing(null);
            showToast(
              editing === "new" ? "기록이 추가되었습니다." : "기록이 수정되었습니다."
            );
          }}
          onDeleted={(id) => {
            setEntries((prev) => prev.filter((e) => e.id !== id));
            setEditing(null);
            showToast("기록이 삭제되었습니다.");
          }}
        />
      )}
    </div>
  );
}
