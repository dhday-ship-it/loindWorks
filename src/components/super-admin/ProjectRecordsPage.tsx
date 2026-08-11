"use client";

import { useEffect, useMemo, useState } from "react";

import { ProjectRecordModal } from "./ProjectRecordModal";
import { calcTax, TAX_TYPE_LABEL } from "@/lib/tax-calc";
import type { TaxType } from "@/generated/prisma/enums";
import type { AdminProjectItem, ProjectRecordItem } from "./types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtWon(n: number | null) {
  if (n === null) return "-";
  return n.toLocaleString("ko-KR");
}

function Check({ on }: { on: boolean }) {
  return (
    <span className={on ? "text-brand-light" : "text-white/20"}>
      {on ? "✓" : "–"}
    </span>
  );
}

function MoneyCell({
  amount,
  taxType,
}: {
  amount: number | null;
  taxType: TaxType;
}) {
  if (amount === null) return <span className="text-white/20">-</span>;
  const b = calcTax(amount, taxType);

  return (
    <div className="whitespace-nowrap font-mono text-[11px] leading-tight">
      <div className="font-bold text-white">{fmtWon(b.net)}</div>
      <div className="text-[9.5px] text-white/35">
        {taxType === "WITHHOLD_3_3" && `공급 ${fmtWon(b.supply)} · 원천 -${fmtWon(b.withholding)}`}
        {taxType === "VAT_EXCLUSIVE" && `공급 ${fmtWon(b.supply)} · +VAT ${fmtWon(b.vat)}`}
        {taxType === "VAT_INCLUSIVE" && `공급 ${fmtWon(b.supply)} · VAT ${fmtWon(b.vat)} 포함`}
        {taxType === "NONE" && TAX_TYPE_LABEL.NONE}
      </div>
    </div>
  );
}

export function ProjectRecordsPage({
  projects,
  showToast,
}: {
  projects: AdminProjectItem[];
  showToast: (msg: string) => void;
}) {
  const [records, setRecords] = useState<ProjectRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProjectRecordItem | "new" | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/project-records")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setLoading(false);
        if (data) setRecords(data.records);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    let income = 0;
    let outsourceCost = 0;
    let unsettled = 0;
    for (const r of records) {
      income += calcTax(r.amount, r.taxType).net;
      if (r.outsourced) {
        outsourceCost += calcTax(r.outsourceTotalAmount, r.outsourceTaxType).net;
      }
      if (!r.settled) unsettled += 1;
    }
    return { income, outsourceCost, profit: income - outsourceCost, unsettled };
  }, [records]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-white">
            프로젝트 기록
          </div>
          <div className="text-xs text-white/40">
            진행 컨디션과 비용 흐름(수금·외주 지출)을 기록하고 세금 반영 금액을 한눈에 확인합니다.
          </div>
        </div>
        <button
          onClick={() => setEditing("new")}
          disabled={projects.length === 0}
          className="admin-btn-primary disabled:opacity-40"
        >
          + 기록 추가
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            수금 합계 (실수령)
          </div>
          <div className="my-1 text-2xl tracking-wide text-brand-light">
            {fmtWon(summary.income)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            외주 지출 합계 (실지급)
          </div>
          <div className="my-1 text-2xl tracking-wide text-amber-300">
            {fmtWon(summary.outsourceCost)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            순수익 (수금 - 외주)
          </div>
          <div
            className={`my-1 text-2xl tracking-wide ${summary.profit >= 0 ? "text-white" : "text-red-400"}`}
          >
            {fmtWon(summary.profit)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            정산 미완료
          </div>
          <div className="my-1 text-2xl tracking-wide text-white">
            {summary.unsettled}건
          </div>
        </div>
      </div>

      <div className="admin-sec-card p-6">
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full min-w-[1400px] border-collapse">
            <thead>
              <tr>
                <th className="whitespace-nowrap">프로젝트</th>
                <th className="whitespace-nowrap">진행 날짜</th>
                <th className="whitespace-nowrap">제목</th>
                <th className="whitespace-nowrap">수금액</th>
                <th className="whitespace-nowrap">선지급</th>
                <th className="whitespace-nowrap">잔금</th>
                <th className="whitespace-nowrap">정산완료</th>
                <th className="whitespace-nowrap">세금계산서</th>
                <th className="whitespace-nowrap">외주</th>
                <th className="whitespace-nowrap">외주 대상</th>
                <th className="whitespace-nowrap">외주 금액</th>
                <th className="whitespace-nowrap">외주 지급</th>
                <th className="whitespace-nowrap">외주 잔금결산</th>
                <th className="whitespace-nowrap">외주 세금계산서</th>
                <th className="whitespace-nowrap">작성자</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={15} className="py-6 text-center text-white/30">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-6 text-center text-white/30">
                    기록이 없습니다.
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setEditing(r)}
                    className="cursor-pointer"
                  >
                    <td className="whitespace-nowrap text-[11px] text-white/60">
                      {r.project.name}
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px] text-white/50">
                      {fmtDate(r.date)}
                    </td>
                    <td className="min-w-[180px] font-semibold text-white">
                      {r.title}
                    </td>
                    <td>
                      <MoneyCell amount={r.amount} taxType={r.taxType} />
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px]">
                      {fmtWon(r.advancePayment)}
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px]">
                      {fmtWon(r.balance)}
                    </td>
                    <td>
                      <Check on={r.settled} />
                    </td>
                    <td>
                      <Check on={r.taxInvoiceIssued} />
                    </td>
                    <td>
                      <Check on={r.outsourced} />
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-white/60">
                      {r.outsourced ? (r.outsourceVendor ?? "-") : "-"}
                    </td>
                    <td>
                      {r.outsourced ? (
                        <MoneyCell
                          amount={r.outsourceTotalAmount}
                          taxType={r.outsourceTaxType}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px]">
                      {r.outsourced ? fmtWon(r.outsourcePayment) : "-"}
                    </td>
                    <td>{r.outsourced ? <Check on={r.outsourceBalanceSettled} /> : "-"}</td>
                    <td>
                      {r.outsourced ? (
                        <Check on={r.outsourceTaxInvoiceIssued} />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-white/50">
                      {r.author.name ?? r.author.email}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProjectRecordModal
          projects={projects}
          record={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setRecords((prev) => {
              const exists = prev.some((r) => r.id === saved.id);
              return exists
                ? prev.map((r) => (r.id === saved.id ? saved : r))
                : [saved, ...prev].sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
            });
            setEditing(null);
            showToast(
              editing === "new"
                ? "기록이 추가되었습니다."
                : "기록이 수정되었습니다."
            );
          }}
          onDeleted={(id) => {
            setRecords((prev) => prev.filter((r) => r.id !== id));
            setEditing(null);
            showToast("기록이 삭제되었습니다.");
          }}
        />
      )}
    </div>
  );
}
