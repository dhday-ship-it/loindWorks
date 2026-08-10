import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireStaff();

  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "SUPER_ADMIN"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ staff });
}
