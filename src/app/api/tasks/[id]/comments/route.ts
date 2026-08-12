import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;

  const comments = await prisma.taskComment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaff();
  const { id: taskId } = await params;
  const { body, mentions } = await request.json();

  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      authorId: user.id,
      body,
      mentions: Array.isArray(mentions) ? mentions : [],
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  // 멘션된 사용자에게 알림 생성
  const mentionIds = Array.isArray(mentions) ? mentions.filter((id: string) => id !== user.id) : [];
  if (mentionIds.length > 0) {
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    await prisma.notification.createMany({
      data: mentionIds.map((userId: string) => ({
        userId,
        type: "TASK_MENTION" as const,
        title: `${user.name ?? user.email}님이 회원님을 멘션했습니다`,
        body: body.slice(0, 100),
        taskId,
        link: task?.projectId ? `/dashboard?project=${task.projectId}&task=${taskId}` : undefined,
      })),
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
