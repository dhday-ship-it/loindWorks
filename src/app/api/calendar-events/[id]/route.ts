import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;

  await prisma.calendarEvent.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
