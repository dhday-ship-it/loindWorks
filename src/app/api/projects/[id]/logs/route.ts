import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaff();
  const { id: projectId } = await params;
  const { type, title, body, withPerson, logDate, taggedUserIds, attachments } =
    await request.json();

  if (!type || !title) {
    return NextResponse.json(
      { error: "유형과 제목은 필수입니다." },
      { status: 400 }
    );
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

  const log = await prisma.activityLog.create({
    data: {
      projectId,
      authorId: user.id,
      type,
      title,
      body: body || undefined,
      withPerson: withPerson || undefined,
      logDate: logDate ? new Date(logDate) : undefined,
      taggedUserIds: Array.isArray(taggedUserIds) ? taggedUserIds : [],
      files: { create: files },
      edits: [
        {
          actorId: user.id,
          actorName: user.name ?? user.email ?? "",
          action: "기록을 등록했습니다.",
          snapshot: "",
          createdAt: new Date().toISOString(),
        },
      ],
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      files: {
        include: { uploader: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  const mentionIds = (Array.isArray(taggedUserIds) ? taggedUserIds : []).filter(
    (id: string) => id !== user.id
  );
  if (mentionIds.length > 0) {
    await prisma.notification.createMany({
      data: mentionIds.map((userId: string) => ({
        userId,
        type: "LOG_MENTION" as const,
        title: `${user.name ?? user.email}님이 기록에 회원님을 태그했습니다`,
        body: title,
        link: `/dashboard?project=${projectId}`,
      })),
    });
  }

  return NextResponse.json({ log }, { status: 201 });
}
