import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { updateStory } from "@/lib/loind-stories";

// 메인페이지 노출 순서 — 받은 id 순서대로 home_order 1..n 을 다시 매긴다.
export async function POST(request: Request) {
  await requireStaff();
  const { ids } = (await request.json()) as { ids?: unknown };
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "ids 가 필요합니다." }, { status: 400 });
  }
  try {
    for (let i = 0; i < ids.length; i++) await updateStory(ids[i], { home_order: i + 1 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
