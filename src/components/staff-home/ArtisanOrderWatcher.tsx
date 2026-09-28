"use client";

import { useEffect, useRef, useState } from "react";

const SEEN_KEY = "artisan_orders_last_seen_at";
const DISMISS_KEY = "artisan_orders_notify_dismissed";
const POLL_INTERVAL_MS = 30_000;

type OrderLite = { id: string; createdAt: string; customerName: string; work: { category: string; title: string } };

// 워크스테이션 어디에 있든(Overview/Calendar/Artisan 등) 새 아티즌 의뢰가 들어오면
// 브라우저 알림을 띄운다. dashboard 레이아웃에 한 번만 마운트된다.
function hasNotificationApi() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function ArtisanOrderWatcher() {
  // 서버 렌더링 시점엔 브라우저 API가 없으니, 하이드레이션 불일치를 피하려면
  // 초기 상태는 항상 "안 보이는" 값으로 두고 마운트 후 useEffect에서 실제 값으로 갱신한다.
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [dismissed, setDismissed] = useState(true);
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasNotificationApi()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 API(Notification/localStorage) 값이라 SSR에서 알 수 없고, 하이드레이션 이후에만 동기화할 수 있다.
    setPermission(Notification.permission);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    lastSeenRef.current = localStorage.getItem(SEEN_KEY);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const res = await fetch("/api/admin/artisan-orders");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      const orders: OrderLite[] = Array.isArray(data?.orders) ? data.orders : [];
      if (orders.length === 0) return;

      // 최초 실행이면 알림 없이 기준 시각만 기록 (기존에 쌓여있던 의뢰를 전부 "새 의뢰"로 띄우지 않도록)
      if (lastSeenRef.current === null) {
        lastSeenRef.current = orders[0].createdAt;
        localStorage.setItem(SEEN_KEY, lastSeenRef.current);
        return;
      }

      const lastSeenTime = new Date(lastSeenRef.current).getTime();
      const newOnes = orders.filter((o) => new Date(o.createdAt).getTime() > lastSeenTime);
      if (newOnes.length === 0) return;

      const latest = newOnes.reduce((max, o) => (o.createdAt > max ? o.createdAt : max), newOnes[0].createdAt);
      lastSeenRef.current = latest;
      localStorage.setItem(SEEN_KEY, latest);

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        for (const o of newOnes.slice(0, 5)) {
          new Notification("새 아티즌 의뢰가 접수됐어요", {
            body: `${o.work.category} · ${o.work.title} — ${o.customerName}`,
            tag: o.id,
          });
        }
      }
    };

    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (permission !== "default" || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[300] flex max-w-[320px] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs shadow-xl shadow-slate-300/40">
      <span className="flex-1 text-slate-600">새 아티즌 의뢰가 들어오면 알림을 받아보시겠어요?</span>
      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          onClick={async () => {
            const result = await Notification.requestPermission();
            setPermission(result);
          }}
          className="cursor-pointer rounded-lg bg-brand px-3 py-1.5 font-bold text-white"
        >
          알림 켜기
        </button>
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          className="cursor-pointer text-slate-300 hover:text-slate-500"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
