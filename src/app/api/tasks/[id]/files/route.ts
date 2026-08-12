import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaff();
  const { id: taskId } = await params;
  const { name, url, size, mimeType } = await request.json();

  if (!name || !url) {
    return NextResponse.json({ error: "파일 정보가 필요합니다." }, { status: 400 });
  }

  // 태스크의 프로젝트 ID 조회
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });
  if (!task) {
    return NextResponse.json({ error: "태스크를 찾을 수 없습니다." }, { status: 404 });
  }

  const file = await prisma.projectFile.create({
    data: {
      name,
      url,
      size: typeof size === "number" ? size : 0,
      mimeType: mimeType ?? undefined,
      projectId: task.projectId!,
      taskId,
      uploaderId: user.id,
    },
  });

  return NextResponse.json({ file }, { status: 201 });
}
