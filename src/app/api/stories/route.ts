import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { createStory, listStories, storiesConfigured, type StoryPayload } from "@/lib/loind-stories";

// loind.com 스토리 관리 (예전 loind.com/admin 을 WORKS 로 옮긴 것). 로그인한 직원만.
export async function GET() {
  await requireStaff();
  if (!storiesConfigured()) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  try {
    return NextResponse.json({ stories: await listStories() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

export async function POST(request: Request) {
  await requireStaff();
  const body = (await request.json()) as Partial<StoryPayload>;
  if (!body.title) return NextResponse.json({ error: "제목을 입력하세요." }, { status: 400 });
  const images = Array.isArray(body.images) ? body.images.filter((s) => typeof s === "string" && s) : [];
  if (!images.length) return NextResponse.json({ error: "이미지를 한 장 이상 등록하세요." }, { status: 400 });
  try {
    const story = await createStory({
      category: String(body.category ?? "Artisan"),
      title: String(body.title),
      img: images[0],
      images,
      text: String(body.text ?? ""),
      summary: body.summary ?? "",
      detail: String(body.detail ?? ""),
      link: body.link ?? "",
      is_recommended: body.is_recommended === true,
      is_home_featured: body.is_home_featured === true,
      home_order: typeof body.home_order === "number" ? body.home_order : 0,
    });
    return NextResponse.json({ story }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
