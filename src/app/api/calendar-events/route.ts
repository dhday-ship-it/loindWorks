import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  await requireStaff();
  const projectId = new URL(request.url).searchParams.get("projectId");

  const events = await prisma.calendarEvent.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { startAt: "asc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const user = await requireStaff();
  const { title, startAt, endAt, sharedWith, projectId } = await request.json();

  if (!title || !startAt) {
    return NextResponse.json(
      { error: "제목과 일시는 필수입니다." },
      { status: 400 }
    );
  }

  const parsedEndAt = endAt ? new Date(endAt) : null;
  if (parsedEndAt && parsedEndAt < new Date(startAt)) {
    return NextResponse.json(
      { error: "종료일은 시작일보다 빠를 수 없습니다." },
      { status: 400 }
    );
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      startAt: new Date(startAt),
      endAt: parsedEndAt,
      sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
      ownerId: user.id,
      projectId: projectId || undefined,
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ event }, { status: 201 });
}
