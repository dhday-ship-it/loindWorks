import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaff();
  const { id: projectId } = await params;

  const { title, body, assigneeUserIds, itemType, attachments } =
    await request.json();

  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }

  const files = Array.isArray(attachments)
    ? attachments
        .filter(
          (a): a is { name: string; url: string; size: number; mimeType?: string } =>
            a && typeof a.url === "string" && typeof a.name === "string"
        )
        .map((a) => ({
          name: a.name,
          url: a.url,
          size: typeof a.size === "number" ? a.size : 0,
          mimeType: a.mimeType ?? null,
          projectId,
          uploaderId: user.id,
        }))
    : [];

  const assignees: string[] = Array.isArray(assigneeUserIds) ? assigneeUserIds : [];
  const resolvedType = typeof itemType === "string" && itemType === "TASK" ? "TASK" : "REQUEST";

  const projectRequest = await prisma.projectRequest.create({
    data: {
      projectId,
      authorId: user.id,
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      body,
      itemType: resolvedType,
      assignees: {
        create: assignees.map((userId: string) => ({ userId })),
      },
      files: { create: files },
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      files: {
        include: { uploader: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ request: projectRequest }, { status: 201 });
}
