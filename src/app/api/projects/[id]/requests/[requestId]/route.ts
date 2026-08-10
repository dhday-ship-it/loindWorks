import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  await requireStaff();
  const { requestId } = await params;

  await prisma.projectRequest.delete({ where: { id: requestId } });

  return NextResponse.json({ ok: true });
}
