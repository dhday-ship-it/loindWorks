"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import { calcTax, TAX_TYPE_LABEL, TAX_TYPES } from "@/lib/tax-calc";
import type { TaxType } from "@/generated/prisma/enums";
import type { AdminProjectItem, ProjectRecordItem } from "./types";

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function fmtWon(n: number) {
  return n.toLocaleString("ko-KR");
}

function TaxBreakdownCard({
  amount,
  taxType,
}: {
  amount: string;
  taxType: TaxType;
}) {
  const n = Number(amount);
  if (!amount || !Number.isFinite(n) || n <= 0) return null;
  const b = calcTax(n, taxType);

  return (
    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[10.5px]">
      <span className="text-white/40">
        공급가액 <span className="text-white/70">{fmtWon(b.supply)}</span>
      </span>
      {taxType !== "WITHHOLD_3_3" && taxType !== "NONE" && (
        <span className="text-white/40">
          부가세 <span className="text-white/70">{fmtWon(b.vat)}</span>
        </span>
      )}
      {taxType === "WITHHOLD_3_3" && (
        <span className="text-amber-300/70">
          원천징수(3.3%) <span className="text-amber-300">-{fmtWon(b.withholding)}</span>
        </span>
      )}
      <span className="text-white/40">
        {taxType === "WITHHOLD_3_3" ? "실지급액" : "합계금액"}{" "}
        <span className="font-bold text-brand-light">{fmtWon(b.net)}</span>
      </span>
    </div>
  );
}

export function ProjectRecordModal({
  projects,
  record,
  onClose,
  onSaved,
  onDeleted,
}: {
  projects: AdminProjectItem[];
  record: ProjectRecordItem | null;
  onClose: () => void;
  onSaved: (record: ProjectRecordItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [projectId, setProjectId] = useState(
    record?.projectId ?? projects[0]?.id ?? ""
  );
  const [title, setTitle] = useState(record?.title ?? "");
  const [date, setDate] = useState(
    record ? toDateInput(record.date) : new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState(record?.note ?? "");

  const [amount, setAmount] = useState(record?.amount?.toString() ?? "");
  const [taxType, setTaxType] = useState<TaxType>(
    record?.taxType ?? "VAT_INCLUSIVE"
  );
  const [advancePayment, setAdvancePayment] = useState(
    record?.advancePayment?.toString() ?? ""
  );
  const [balance, setBalance] = useState(record?.balance?.toString() ?? "");
  const [settled, setSettled] = useState(record?.settled ?? false);
  const [taxInvoiceIssued, setTaxInvoiceIssued] = useState(
    record?.taxInvoiceIssued ?? false
  );

  const [outsourced, setOutsourced] = useState(record?.outsourced ?? false);
  const [outsourceVendor, setOutsourceVendor] = useState(
    record?.outsourceVendor ?? ""
  );
  const [outsourceTotalAmount, setOutsourceTotalAmount] = useState(
    record?.outsourceTotalAmount?.toString() ?? ""
  );
  const [outsourceTaxType, setOutsourceTaxType] = useState<TaxType>(
    record?.outsourceTaxType ?? "NONE"
  );
  const [outsourcePayment, setOutsourcePayment] = useState(
    record?.outsourcePayment?.toString() ?? ""
  );
  const [outsourceBalanceSettled, setOutsourceBalanceSettled] = useState(
    record?.outsourceBalanceSettled ?? false
  );
  const [outsourceTaxInvoiceIssued, setOutsourceTaxInvoiceIssued] = useState(
    record?.outsourceTaxInvoiceIssued ?? false
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!projectId || !title.trim() || !date) {
      setError("프로젝트, 제목, 날짜는 필수입니다.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      projectId,
      date,
      title,
      note: note || null,
      amount,
      taxType,
      advancePayment,
      balance,
      settled,
      taxInvoiceIssued,
      outsourced,
      outsourceVendor,
      outsourceTotalAmount,
      outsourceTaxType,
      outsourcePayment,
      outsourceBalanceSettled,
      outsourceTaxInvoiceIssued,
    };

    const res = record
      ? await fetch(`/api/admin/project-records/${record.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/project-records", {
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

    const { record: saved } = await res.json();
    onSaved(saved);
  };

  const remove = async () => {
    if (!record) return;
    if (!window.confirm(`"${record.title}" 기록을 삭제할까요? 되돌릴 수 없습니다.`))
      return;
    setSaving(true);
    const res = await fetch(`/api/admin/project-records/${record.id}`, {
      method: "DELETE",
    });
    setSaving(false);
    if (res.ok) onDeleted(record.id);
  };

  return (
    <Modal
      title={record ? "기록 수정" : "새 기록 추가"}
      subtitle="진행 상황과 비용 내역을 기록합니다."
      onClose={onClose}
    >
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            프로젝트
          </span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="admin-input cursor-pointer"
          >
            {projects.length === 0 && (
              <option value="" className="bg-[#0c0e12]">
                생성된 프로젝트가 없습니다.
              </option>
            )}
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0c0e12]">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              진행 날짜
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
              제목
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="admin-input"
              placeholder="예: 2차 시안 컨펌 및 중도금 정산"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/50">
            Part 1 · 기본 정보 및 진행 컨디션
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="admin-input min-h-[80px] resize-none"
            placeholder="진행 상황, 특이사항, 컨디션 등을 기록하세요..."
          />
        </div>

        <div className="rounded-[10px] border border-white/10 bg-black/20 p-4">
          <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-white/50">
            Part 2 · 회계처리 — 수금 내역
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/40">금액 (원)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="admin-input"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/40">과세 방식</span>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value as TaxType)}
                className="admin-input cursor-pointer"
              >
                {TAX_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0c0e12]">
                    {TAX_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TaxBreakdownCard amount={amount} taxType={taxType} />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/40">선지급 (원)</span>
              <input
                type="number"
                value={advancePayment}
                onChange={(e) => setAdvancePayment(e.target.value)}
                className="admin-input"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/40">잔금 (원)</span>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="admin-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 border-t border-white/5 pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={settled}
                onChange={(e) => setSettled(e.target.checked)}
                className="accent-brand-light"
              />
              정산 완료
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={taxInvoiceIssued}
                onChange={(e) => setTaxInvoiceIssued(e.target.checked)}
                className="accent-brand-light"
              />
              세금계산서 발행여부
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-white">
              <input
                type="checkbox"
                checked={outsourced}
                onChange={(e) => setOutsourced(e.target.checked)}
                className="accent-brand-light"
              />
              외주 사용여부
            </label>
          </div>

          {outsourced && (
            <div className="animate-fade-up mt-3 rounded-[10px] border border-white/10 bg-white/[0.03] p-3.5">
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-white/40">
                외주 지출 내역
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40">대상 (거래처)</span>
                  <input
                    value={outsourceVendor}
                    onChange={(e) => setOutsourceVendor(e.target.value)}
                    className="admin-input"
                    placeholder="예: OO스튜디오"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40">금액 (원)</span>
                  <input
                    type="number"
                    value={outsourceTotalAmount}
                    onChange={(e) => setOutsourceTotalAmount(e.target.value)}
                    className="admin-input"
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40">과세 방식</span>
                  <select
                    value={outsourceTaxType}
                    onChange={(e) =>
                      setOutsourceTaxType(e.target.value as TaxType)
                    }
                    className="admin-input cursor-pointer"
                  >
                    {TAX_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#0c0e12]">
                        {TAX_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40">지급 (원)</span>
                  <input
                    type="number"
                    value={outsourcePayment}
                    onChange={(e) => setOutsourcePayment(e.target.value)}
                    className="admin-input"
                    placeholder="0"
                  />
                </div>
              </div>

              <TaxBreakdownCard
                amount={outsourceTotalAmount}
                taxType={outsourceTaxType}
              />

              <div className="mt-3 flex flex-wrap gap-4 border-t border-white/5 pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={outsourceBalanceSettled}
                    onChange={(e) => setOutsourceBalanceSettled(e.target.checked)}
                    className="accent-brand-light"
                  />
                  잔금 결산
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={outsourceTaxInvoiceIssued}
                    onChange={(e) => setOutsourceTaxInvoiceIssued(e.target.checked)}
                    className="accent-brand-light"
                  />
                  세금계산서 발행
                </label>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          {record ? (
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
