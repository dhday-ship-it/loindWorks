import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  const { name, contactName, contactEmail, contactPhone } =
    await request.json();

  if (name !== undefined && !String(name).trim()) {
    return NextResponse.json(
      { error: "회사명을 입력해주세요." },
      { status: 400 }
    );
  }

  const company = await prisma.company.update({
    where: { id },
    data: {
      name: name !== undefined ? String(name).trim() : undefined,
      contactName: contactName !== undefined ? contactName || null : undefined,
      contactEmail:
        contactEmail !== undefined ? contactEmail || null : undefined,
      contactPhone:
        contactPhone !== undefined ? contactPhone || null : undefined,
    },
    include: {
      _count: { select: { users: true, projects: true } },
    },
  });

  return NextResponse.json({ company });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;

  await prisma.company.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
