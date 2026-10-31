import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { uploadStoryImage } from "@/lib/loind-stories";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request) {
  await requireStaff();
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "파일은 25MB 이하만 업로드할 수 있습니다." }, { status: 400 });
  try {
    return NextResponse.json({ url: await uploadStoryImage(file) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
