import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { requireStaff, requireSuperAdmin } from "@/lib/auth-guards";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "파일은 25MB 이하만 업로드할 수 있습니다." }, { status: 400 });
  }

  const scope = formData.get("scope");
  let pathPrefix: string;
  if (scope === "banner" || scope === "artisan") {
    await requireSuperAdmin();
    pathPrefix = scope === "artisan" ? "artisan" : "banners";
  } else {
    await requireStaff();
    const projectId = formData.get("projectId");
    if (typeof projectId !== "string" || !projectId) {
      return NextResponse.json({ error: "projectId가 필요합니다." }, { status: 400 });
    }
    pathPrefix = `projects/${projectId}`;
  }

  const blob = await put(`${pathPrefix}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({
    name: file.name,
    url: blob.url,
    size: file.size,
    mimeType: file.type || null,
  });
}
