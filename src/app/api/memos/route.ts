import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireStaff();

  const memos = await prisma.memo.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { folder: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ memos });
}

export async function POST(request: Request) {
  const user = await requireStaff();
  const { title, body, folderId, pinned } = await request.json();

  if (!title && !body) {
    return NextResponse.json(
      { error: "제목이나 내용이 필요합니다." },
      { status: 400 }
    );
  }

  const memo = await prisma.memo.create({
    data: {
      title: title || "제목 없음",
      body: body || undefined,
      folderId: folderId || undefined,
      pinned: Boolean(pinned),
      ownerId: user.id,
    },
    include: { folder: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ memo }, { status: 201 });
}
