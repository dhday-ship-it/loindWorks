import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireStaff();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

// 읽음 처리
export async function PATCH(request: Request) {
  const user = await requireStaff();
  const { ids } = await request.json();

  if (Array.isArray(ids) && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: user.id },
      data: { read: true },
    });
  } else {
    // ids 없으면 전체 읽음 처리
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ ok: true });
}
