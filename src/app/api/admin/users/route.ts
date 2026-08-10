import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  await requireSuperAdmin();

  const users = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "CLIENT"] } },
    select: userSelect,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  await requireSuperAdmin();
  const { name, email, password, role, companyId, projectIds } =
    await request.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "이름, 이메일, 비밀번호, 역할은 필수입니다." },
      { status: 400 }
    );
  }

  if (role !== "STAFF" && role !== "CLIENT") {
    return NextResponse.json(
      { error: "역할은 STAFF 또는 CLIENT여야 합니다." },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "비밀번호는 8자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "이미 가입된 이메일입니다." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      companyId: role === "CLIENT" ? companyId || undefined : undefined,
      projectMemberships:
        role === "CLIENT" && Array.isArray(projectIds) && projectIds.length
          ? {
              create: projectIds.map((projectId: string) => ({
                projectId,
                roleLabel: "Client",
              })),
            }
          : undefined,
    },
    select: userSelect,
  });

  return NextResponse.json({ user }, { status: 201 });
}
