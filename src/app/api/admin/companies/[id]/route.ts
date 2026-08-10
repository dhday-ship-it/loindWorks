import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;

  await prisma.company.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
