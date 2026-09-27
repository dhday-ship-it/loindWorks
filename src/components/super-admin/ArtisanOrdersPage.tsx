"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { Modal } from "./Modal";
import type { StaffOption } from "./types";
import type { ArtisanOrderItem } from "../artisan/types";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PAID: { label: "접수완료", cls: "admin-b-pending" },
  IN_PRODUCTION: { label: "제작중", cls: "admin-b-wip" },
  INTERNAL_REVIEW: { label: "운영진 검수중", cls: "admin-b-wip" },
  DRAFT_SENT: { label: "시안 전달됨", cls: "admin-b-wip" },
  REVISION_REQUESTED: { label: "수정요청", cls: "admin-b-pending" },
  APPROVED: { label: "최종승인", cls: "admin-b-done" },
  DELIVERED: { label: "전달완료", cls: "admin-b-done" },
  CANCELLED: { label: "취소", cls: "admin-b-super" },
};
const STATUS_ORDER = Object.keys(STATUS_META);

// 카테고리마다 다르게 들어오는 부가 필드. 값이 있는 것만 상세 모달에 노출한다.
type StringFieldKey = "size" | "referenceLink" | "shootPreference" | "shootLocation" | "shootTime" | "quantity" | "desiredDeadline" | "shippingAddress";
const FIELD_LABELS: Record<StringFieldKey, string> = {
  size: "사이즈",
  referenceLink: "참고 레퍼런스 링크",
  shootPreference: "촬영 희망 날짜/장소",
  shootLocation: "촬영 장소",
  shootTime: "촬영 희망 시간",
  quantity: "수량",
  desiredDeadline: "희망 납기일",
  shippingAddress: "배송지",
};

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("scope", "artisanOrder");
  const response = await fetch("/api/upload", { method: "POST", body: formData });
  if (!response.ok) throw new Error("파일 업로드에 실패했습니다.");
  return (await response.json()).url as string;
}

export function ArtisanOrdersPage({ showToast }: { showToast: (message: string) => void }) {
  const [orders, setOrders] = useState<ArtisanOrderItem[] | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [selected, setSelected] = useState<ArtisanOrderItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const load = () => {
    fetch("/api/admin/artisan-orders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrders(Array.isArray(data?.orders) ? data.orders : []));
  };

  useEffect(() => {
    load();
    fetch("/api/staff")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStaff(Array.isArray(data?.staff) ? data.staff : []));
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return statusFilter === "ALL" ? orders : orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const patch = async (id: string, patchBody: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/artisan-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    });
    if (!res.ok) {
      showToast("업데이트에 실패했습니다.");
      return;
    }
    const data = await res.json();
    setOrders((current) => (current ?? []).map((o) => (o.id === id ? data.order : o)));
    setSelected((current) => (current && current.id === id ? data.order : current));
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-slate-800">의뢰 접수함</div>
          <div className="text-xs text-slate-500">아티즌 홈페이지에서 접수된 의뢰를 확인하고 진행 상태를 관리합니다.</div>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand"
        >
          <option value="ALL">전체 상태</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      <section className="admin-sec-card p-6">
        {orders === null && <div className="py-6 text-center text-sm text-slate-400">불러오는 중...</div>}
        {orders !== null && filtered.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-400">접수된 의뢰가 없습니다.</div>
        )}
        {orders !== null && filtered.length > 0 && (
          <table className="admin-tbl w-full">
            <thead>
              <tr>
                <th>상태</th>
                <th>카테고리 / 타입</th>
                <th>고객</th>
                <th>연락처</th>
                <th>접수일</th>
                <th>담당자</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="cursor-pointer" onClick={() => setSelected(order)}>
                  <td>
                    <span className={`admin-badge ${STATUS_META[order.status]?.cls ?? "admin-b-staff"}`}>
                      {STATUS_META[order.status]?.label ?? order.status}
                    </span>
                  </td>
                  <td>{order.work.category} · {order.work.title}</td>
                  <td>{order.customerName}{order.churchName ? ` (${order.churchName})` : ""}</td>
                  <td>{order.customerPhone}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString("ko-KR")}</td>
                  <td>{order.assignedStaff?.name ?? order.assignedStaff?.email ?? "미배정"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selected && (
        <OrderDetailModal
          order={selected}
          staff={staff}
          onClose={() => setSelected(null)}
          onPatch={(patchBody) => patch(selected.id, patchBody)}
        />
      )}
    </div>
  );
}

function OrderDetailModal({
  order,
  staff,
  onClose,
  onPatch,
}: {
  order: ArtisanOrderItem;
  staff: StaffOption[];
  onClose: () => void;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const [uploadingDraft, setUploadingDraft] = useState(false);
  const [uploadingFinal, setUploadingFinal] = useState(false);

  const extraFieldKeys = (Object.keys(FIELD_LABELS) as StringFieldKey[]).filter((key) => order[key]);
  const hasExtra = extraFieldKeys.length > 0 || order.wantsEditing || order.deliveryType === "PHYSICAL" || order.referenceFileUrl;

  return (
    <Modal
      title={`${order.work.category} · ${order.work.title}`}
      subtitle={`접수일 ${new Date(order.createdAt).toLocaleString("ko-KR")}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] text-slate-400">
            진행 상태
            <select
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
              value={order.status}
              onChange={(event) => onPatch({ status: event.target.value })}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-slate-400">
            담당자
            <select
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
              value={order.assignedStaffId ?? ""}
              onChange={(event) => onPatch({ assignedStaffId: event.target.value || null })}
            >
              <option value="">미배정</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name ?? s.email}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-slate-100 p-4">
          <div className="mb-2 text-xs font-bold text-slate-500">고객 정보</div>
          <div className="grid grid-cols-[64px_1fr] gap-y-1.5 text-sm text-slate-700">
            <span className="text-slate-400">이름</span><span>{order.customerName}</span>
            <span className="text-slate-400">연락처</span><span>{order.customerPhone}</span>
            <span className="text-slate-400">이메일</span><span>{order.customerEmail ?? "-"}</span>
            <span className="text-slate-400">소속</span><span>{order.churchName ?? "-"}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 p-4">
          <div className="mb-2 text-xs font-bold text-slate-500">요청 내용</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{order.requestText}</p>
        </div>

        {hasExtra && (
          <div className="rounded-xl border border-slate-100 p-4">
            <div className="mb-2 text-xs font-bold text-slate-500">추가 정보</div>
            <div className="grid grid-cols-[64px_1fr] gap-y-1.5 text-sm text-slate-700">
              {extraFieldKeys.map((key) => (
                <Fragment key={key}>
                  <span className="text-slate-400">{FIELD_LABELS[key]}</span>
                  <span>{order[key]}</span>
                </Fragment>
              ))}
              {order.wantsEditing && (
                <>
                  <span className="text-slate-400">편집 추가</span><span>예</span>
                </>
              )}
              {order.deliveryType === "PHYSICAL" && (
                <>
                  <span className="text-slate-400">배송 방식</span><span>실물 인쇄·배송</span>
                </>
              )}
              {order.referenceFileUrl && (
                <>
                  <span className="text-slate-400">첨부 파일</span>
                  <a href={order.referenceFileUrl} target="_blank" rel="noreferrer" className="text-brand underline">파일 열기 ↗</a>
                </>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-100 p-4">
          <div className="mb-3 text-xs font-bold text-slate-500">시안 · 최종 파일 전달</div>
          <div className="space-y-2.5">
            <FileRow
              label="시안 파일"
              url={order.draftFileUrl}
              uploading={uploadingDraft}
              onUpload={async (file) => {
                setUploadingDraft(true);
                try {
                  onPatch({ draftFileUrl: await uploadFile(file) });
                } finally {
                  setUploadingDraft(false);
                }
              }}
              onClear={() => onPatch({ draftFileUrl: null })}
            />
            <FileRow
              label="최종 파일"
              url={order.finalFileUrl}
              uploading={uploadingFinal}
              onUpload={async (file) => {
                setUploadingFinal(true);
                try {
                  onPatch({ finalFileUrl: await uploadFile(file) });
                } finally {
                  setUploadingFinal(false);
                }
              }}
              onClear={() => onPatch({ finalFileUrl: null })}
            />
          </div>
        </div>

        <button onClick={onClose} className="admin-btn-ghost w-full justify-center">닫기</button>
      </div>
    </Modal>
  );
}

function FileRow({
  label,
  url,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[11px] text-slate-400">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm text-brand underline">{url}</a>
      ) : (
        <span className="flex-1 text-sm text-slate-300">등록되지 않음</span>
      )}
      <label className="admin-btn-ghost cursor-pointer shrink-0">
        {uploading ? "업로드 중..." : "업로드"}
        <input
          className="hidden"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </label>
      {url && <button onClick={onClear} className="shrink-0 text-[11px] text-slate-400 underline">삭제</button>}
    </div>
  );
}
