import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireStaff();
  const banners = await prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, imageUrl: true, linkUrl: true },
  });
  return NextResponse.json({ banners });
}
