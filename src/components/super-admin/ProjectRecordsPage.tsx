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

function StatusBadge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span className={`admin-badge ${on ? "admin-b-done" : "admin-b-pending"}`}>
      {on ? onLabel : offLabel}
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
  if (amount === null) return <span className="text-slate-300">-</span>;
  const b = calcTax(amount, taxType);

  return (
    <div className="whitespace-nowrap font-mono text-[11px] leading-tight">
      <div className="font-bold text-slate-800">{fmtWon(b.net)}</div>
      <div className="text-[9.5px] text-slate-400">
        {taxType === "WITHHOLD_3_3" && `공급 ${fmtWon(b.supply)} · 원천 -${fmtWon(b.withholding)}`}
        {taxType === "VAT_EXCLUSIVE" && `공급 ${fmtWon(b.supply)} · +VAT ${fmtWon(b.vat)}`}
        {taxType === "VAT_INCLUSIVE" && `공급 ${fmtWon(b.supply)} · VAT ${fmtWon(b.vat)} 포함`}
        {taxType === "NONE" && TAX_TYPE_LABEL.NONE}
      </div>
    </div>
  );
}

function OutsourceCell({ outsources }: { outsources: ProjectRecordItem["outsources"] }) {
  if (outsources.length === 0) {
    return <span className="text-[11px] text-slate-300">-</span>;
  }
  return (
    <div className="flex min-w-[220px] flex-col gap-2 py-1">
      {outsources.map((o) => (
        <div
          key={o.id}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
        >
          <span className="text-[11px] font-semibold text-slate-700">{o.vendor}</span>
          <MoneyCell amount={o.totalAmount} taxType={o.taxType} />
          <span className="text-[9.5px] text-slate-400">
            지급 {fmtWon(o.payment)}
          </span>
          <StatusBadge on={o.balanceSettled} onLabel="정산완료" offLabel="미정산" />
          <StatusBadge on={o.taxInvoiceIssued} onLabel="계산서 O" offLabel="계산서 X" />
        </div>
      ))}
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
    let outsourceUnsettled = 0;
    for (const r of records) {
      income += calcTax(r.amount, r.taxType).net;
      for (const o of r.outsources) {
        outsourceCost += calcTax(o.totalAmount, o.taxType).net;
        if (!o.balanceSettled) outsourceUnsettled += 1;
      }
      if (!r.settled) unsettled += 1;
    }
    return {
      income,
      outsourceCost,
      profit: income - outsourceCost,
      unsettled,
      outsourceUnsettled,
    };
  }, [records]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-slate-800">
            프로젝트 장부
          </div>
          <div className="text-xs text-slate-500">
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

      <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            수금 합계 (실수령)
          </div>
          <div className="my-1 text-2xl tracking-wide text-brand-light">
            {fmtWon(summary.income)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            외주 지출 합계 (실지급)
          </div>
          <div className="my-1 text-2xl tracking-wide text-amber-300">
            {fmtWon(summary.outsourceCost)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            순수익 (수금 - 외주)
          </div>
          <div
            className={`my-1 text-2xl tracking-wide ${summary.profit >= 0 ? "text-slate-800" : "text-red-400"}`}
          >
            {fmtWon(summary.profit)}
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            정산 미완료
          </div>
          <div className="my-1 text-2xl tracking-wide text-slate-800">
            {summary.unsettled}건
          </div>
        </div>
        <div className="admin-stat-card px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            외주 미정산
          </div>
          <div className="my-1 text-2xl tracking-wide text-slate-800">
            {summary.outsourceUnsettled}건
          </div>
        </div>
      </div>

      <div className="admin-sec-card p-6">
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full min-w-[1280px] border-collapse">
            <thead>
              <tr>
                <th className="whitespace-nowrap">프로젝트</th>
                <th className="whitespace-nowrap">진행 날짜</th>
                <th className="whitespace-nowrap">제목</th>
                <th className="whitespace-nowrap">수금액</th>
                <th className="whitespace-nowrap">선지급</th>
                <th className="whitespace-nowrap">잔금</th>
                <th className="whitespace-nowrap">정산 상태</th>
                <th className="whitespace-nowrap">외주 내역</th>
                <th className="whitespace-nowrap">작성자</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
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
                    <td className="whitespace-nowrap text-[11px] text-slate-600">
                      {r.project.name}
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {fmtDate(r.date)}
                    </td>
                    <td className="min-w-[180px] font-semibold text-slate-800">
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
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge on={r.settled} onLabel="정산완료" offLabel="미정산" />
                        <StatusBadge on={r.taxInvoiceIssued} onLabel="계산서 O" offLabel="계산서 X" />
                      </div>
                    </td>
                    <td>
                      <OutsourceCell outsources={r.outsources} />
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-slate-600">
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
