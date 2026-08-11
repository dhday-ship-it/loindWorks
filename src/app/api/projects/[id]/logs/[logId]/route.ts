import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

interface Edit {
  actorId: string;
  actorName: string;
  action: string;
  snapshot: string;
  createdAt: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const user = await requireStaff();
  const { logId } = await params;
  const { title, body, taggedUserIds } = await request.json();

  const existing = await prisma.activityLog.findUniqueOrThrow({
    where: { id: logId },
    select: { title: true, body: true, edits: true },
  });

  const edits = Array.isArray(existing.edits)
    ? (existing.edits as unknown as Edit[])
    : [];
  const snapshot = `${existing.title}\n\n${existing.body ?? ""}`;
  const nextEdits = [
    ...edits,
    {
      actorId: user.id,
      actorName: user.name ?? user.email ?? "",
      action: "기록을 수정했습니다.",
      snapshot,
      createdAt: new Date().toISOString(),
    },
  ];

  const log = await prisma.activityLog.update({
    where: { id: logId },
    data: {
      title: title || undefined,
      body: body !== undefined ? body : undefined,
      taggedUserIds: Array.isArray(taggedUserIds) ? taggedUserIds : undefined,
      edits: nextEdits as unknown as Prisma.InputJsonValue,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ log });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  await requireStaff();
  const { logId } = await params;

  await prisma.activityLog.delete({ where: { id: logId } });

  return NextResponse.json({ ok: true });
}
