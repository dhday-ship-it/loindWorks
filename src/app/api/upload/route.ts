import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request) {
  const user = await requireUser();

  const formData = await request.formData();
  const file = formData.get("file");
  const projectId = formData.get("projectId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "파일은 25MB 이하만 업로드할 수 있습니다." },
      { status: 400 }
    );
  }
  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "projectId가 필요합니다." }, { status: 400 });
  }

  if (user.role === "CLIENT") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
  } else if (user.role !== "STAFF" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const blob = await put(`projects/${projectId}/${Date.now()}-${file.name}`, file, {
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
