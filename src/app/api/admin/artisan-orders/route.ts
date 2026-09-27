import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// 로인드 내부 작업팀/운영진이 보는 주문 큐. 외부 계정 개념이 없으므로 staff 전체가 본다.
export async function GET() {
  await requireStaff();
  const orders = await prisma.artisanOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      work: { select: { id: true, title: true, category: true, imageUrl: true } },
      assignedStaff: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ orders });
}
