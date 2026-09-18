import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

const CHANGEABLE_ROLES: Role[] = ["PM", "STAFF"];

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  company: { select: { id: true, name: true } },
  projectMemberships: {
    select: { project: { select: { id: true, name: true } } },
  },
} as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  const { id } = await params;
  const { role } = await request.json();

  if (!CHANGEABLE_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "역할은 PM 또는 STAFF여야 합니다." },
      { status: 400 }
    );
  }

  if (id === admin.id) {
    return NextResponse.json(
      { error: "본인 계정의 역할은 변경할 수 없습니다." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: userSelect,
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "본인 계정은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
