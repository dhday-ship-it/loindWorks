"use client";

import { useEffect, useMemo, useState } from "react";

import { LoanAdvanceModal } from "./LoanAdvanceModal";
import type { LoanAdvanceEntryItem } from "./types";

const TYPE_LABEL = { LOAN: "대출", ADVANCE: "가지급금" } as const;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtWon(n: number) {
  return n.toLocaleString("ko-KR");
}

export function LoanAdvancePage({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [entries, setEntries] = useState<LoanAdvanceEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LoanAdvanceEntryItem | "new" | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/loan-advances")
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
    let amount = 0;
    let repaid = 0;
    for (const e of entries) {
      amount += e.amount;
      repaid += e.repaid;
    }
    return { amount, repaid, outstanding: amount - repaid };
  }, [entries]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-slate-800">
            대출·가지급금 관리
          </div>
          <div className="text-xs text-slate-500">
            법인 대출 및 가지급금의 지급·회수 내역을 관리하고 미납 잔액을 확인합니다.
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
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            지급액 합계
          </div>
          <div className="my-1 text-2xl tracking-wide text-slate-800">
            {fmtWon(summary.amount)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            회수액 합계
          </div>
          <div className="my-1 text-2xl tracking-wide text-brand-light">
            {fmtWon(summary.repaid)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            미납 잔액 합계
          </div>
          <div
            className={`my-1 text-2xl tracking-wide ${summary.outstanding > 0 ? "text-amber-300" : "text-slate-800"}`}
          >
            {fmtWon(summary.outstanding)}
          </div>
        </div>
      </div>

      <div className="admin-sec-card p-6">
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th className="whitespace-nowrap">일자</th>
                <th className="whitespace-nowrap">구분</th>
                <th className="whitespace-nowrap">성명/거래처</th>
                <th className="whitespace-nowrap">지급액</th>
                <th className="whitespace-nowrap">회수액</th>
                <th className="whitespace-nowrap">미납잔액</th>
                <th className="whitespace-nowrap">비고</th>
                <th className="whitespace-nowrap">작성자</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    기록이 없습니다.
                  </td>
                </tr>
              )}
              {!loading &&
                entries.map((e) => {
                  const outstanding = e.amount - e.repaid;
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setEditing(e)}
                      className="cursor-pointer"
                    >
                      <td className="whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {fmtDate(e.date)}
                      </td>
                      <td className="whitespace-nowrap">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            e.type === "LOAN"
                              ? "border-blue-400/30 bg-blue-400/10 text-blue-300"
                              : "border-purple-400/30 bg-purple-400/10 text-purple-300"
                          }`}
                        >
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="min-w-[140px] font-semibold text-slate-800">
                        {e.counterparty}
                      </td>
                      <td className="whitespace-nowrap font-mono text-[11px]">
                        {fmtWon(e.amount)}
                      </td>
                      <td className="whitespace-nowrap font-mono text-[11px] text-brand-light">
                        {fmtWon(e.repaid)}
                      </td>
                      <td
                        className={`whitespace-nowrap font-mono text-[11px] font-bold ${outstanding > 0 ? "text-amber-300" : "text-slate-500"}`}
                      >
                        {fmtWon(outstanding)}
                      </td>
                      <td className="min-w-[140px] text-[11px] text-slate-600">
                        {e.note ?? "-"}
                      </td>
                      <td className="whitespace-nowrap text-[11px] text-slate-600">
                        {e.author.name ?? e.author.email}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <LoanAdvanceModal
          entry={editing === "new" ? null : editing}
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
