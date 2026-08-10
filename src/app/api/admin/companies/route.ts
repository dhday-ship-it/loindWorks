import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireSuperAdmin();

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { users: true, projects: true } },
    },
  });

  return NextResponse.json({ companies });
}

export async function POST(request: Request) {
  await requireSuperAdmin();
  const { name, companyId, contactName, contactEmail } = await request.json();

  if (!name || !companyId) {
    return NextResponse.json(
      { error: "회사명과 Company ID는 필수입니다." },
      { status: 400 }
    );
  }

  const slug = String(companyId).trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Company ID는 영문 소문자, 숫자, 하이픈만 가능합니다." },
      { status: 400 }
    );
  }

  const existing = await prisma.company.findUnique({
    where: { companyId: slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "이미 존재하는 Company ID입니다." },
      { status: 409 }
    );
  }

  const company = await prisma.company.create({
    data: {
      name,
      companyId: slug,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
    },
    include: {
      _count: { select: { users: true, projects: true } },
    },
  });

  return NextResponse.json({ company }, { status: 201 });
}
