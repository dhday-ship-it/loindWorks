import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { deleteStory, updateStory, type StoryPayload } from "@/lib/loind-stories";

const FIELDS: (keyof StoryPayload)[] = [
  "category", "title", "img", "images", "text", "summary", "detail", "link",
  "is_recommended", "is_home_featured", "home_order",
];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const body = (await request.json()) as Partial<StoryPayload>;
  const patch: Partial<StoryPayload> = {};
  for (const k of FIELDS) if (k in body) (patch as Record<string, unknown>)[k] = body[k];
  if (Array.isArray(patch.images) && patch.images.length) patch.img = patch.images[0];
  try {
    return NextResponse.json({ story: await updateStory(id, patch) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  try {
    await deleteStory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
