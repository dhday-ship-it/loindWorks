"use client";

import { useEffect, useMemo, useState } from "react";

import { OrderDetailModal, STATUS_META } from "@/components/artisan/OrderDetailModal";
import type { ArtisanOrderItem } from "@/components/artisan/types";
import type { StaffOption } from "@/components/super-admin/types";

type BucketKey = "unassigned" | "wip" | "done";

const BUCKETS: { key: BucketKey; label: string; statuses: string[] }[] = [
  { key: "unassigned", label: "의뢰", statuses: ["PAID"] },
  { key: "wip", label: "작업중", statuses: ["IN_PRODUCTION", "INTERNAL_REVIEW", "DRAFT_SENT", "REVISION_REQUESTED"] },
  { key: "done", label: "완료", statuses: ["APPROVED", "DELIVERED"] },
];

// 워크스테이션 "Artisan" 메뉴의 메인 콘텐츠. 관리자 화면에 있던 "의뢰 접수함"을 그대로
// 옮겨온 것으로, 상태를 전체 드롭다운 대신 의뢰(미배정)/작업중/완료 3개 탭으로 묶어서 보여준다.
export function ArtisanOrderBoard() {
  const [orders, setOrders] = useState<ArtisanOrderItem[] | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [bucket, setBucket] = useState<BucketKey>("unassigned");
  const [selected, setSelected] = useState<ArtisanOrderItem | null>(null);

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

  const counts = useMemo(() => {
    const map: Record<BucketKey, number> = { unassigned: 0, wip: 0, done: 0 };
    for (const o of orders ?? []) {
      const b = BUCKETS.find((x) => x.statuses.includes(o.status));
      if (b) map[b.key] += 1;
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const statuses = BUCKETS.find((b) => b.key === bucket)?.statuses ?? [];
    return (orders ?? []).filter((o) => statuses.includes(o.status));
  }, [orders, bucket]);

  const patch = async (id: string, patchBody: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/artisan-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    });
    if (!res.ok) return;
    const data = await res.json();
    setOrders((current) => (current ?? []).map((o) => (o.id === id ? data.order : o)));
    setSelected((current) => (current && current.id === id ? data.order : current));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 shrink-0">
        <div className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-light">
          LOIND Creator Ground
        </div>
        <h1 className="text-2xl font-bold text-slate-800">아티즌 의뢰 접수함</h1>
        <p className="mt-1 text-sm text-slate-400">아티즌 홈페이지에서 접수된 의뢰를 확인하고 진행 상태를 관리하세요.</p>
      </div>

      <div className="mb-4 flex w-fit shrink-0 gap-1 rounded-lg bg-slate-50 p-0.5 text-xs font-semibold">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            onClick={() => setBucket(b.key)}
            className={`cursor-pointer rounded-md px-4 py-1.5 transition-all ${
              bucket === b.key ? "bg-white text-brand shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {b.label} {counts[b.key]}
          </button>
        ))}
      </div>

      <div className="admin-sec-card min-h-0 flex-1 overflow-y-auto p-6">
        {orders === null && <div className="py-6 text-center text-sm text-slate-400">불러오는 중...</div>}
        {orders !== null && filtered.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-400">해당하는 의뢰가 없어요.</div>
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
      </div>

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
