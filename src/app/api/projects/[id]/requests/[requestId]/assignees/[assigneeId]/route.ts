import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { RequestStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

const VALID_STATUSES: RequestStatus[] = ["WAIT", "CHECK", "WIP", "REVIEW", "DONE"];

interface Comment {
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string; assigneeId: string }> }
) {
  const user = await requireStaff();
  const { assigneeId } = await params;
  const { status, comment } = await request.json();

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "잘못된 상태값입니다." }, { status: 400 });
  }

  const existing = await prisma.requestAssignee.findUniqueOrThrow({
    where: { id: assigneeId },
    select: { userId: true, comments: true },
  });

  if (status !== undefined && existing.userId !== user.id && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "담당자 본인만 상태를 변경할 수 있습니다." }, { status: 403 });
  }

  const data: Prisma.RequestAssigneeUpdateInput = {};

  if (status !== undefined) data.status = status;

  if (typeof comment === "string" && comment.trim()) {
    const list = Array.isArray(existing.comments)
      ? (existing.comments as unknown as Comment[])
      : [];
    const next: Comment = {
      authorId: user.id,
      authorName: user.name ?? user.email ?? "",
      text: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    data.comments = [...list, next] as unknown as Prisma.InputJsonValue;
  }

  const assignee = await prisma.requestAssignee.update({
    where: { id: assigneeId },
    data,
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ assignee });
}
