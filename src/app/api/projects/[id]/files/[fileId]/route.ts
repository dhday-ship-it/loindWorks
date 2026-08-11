import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  await requireStaff();
  const { fileId } = await params;

  const file = await prisma.projectFile.findUnique({ where: { id: fileId } });
  if (!file) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.projectFile.delete({ where: { id: fileId } });
  await del(file.url).catch(() => {});

  return NextResponse.json({ ok: true });
}
