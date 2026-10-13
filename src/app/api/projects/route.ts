import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireStaff();

  // 모든 인증 사용자가 전체 Works를 조회할 수 있다.
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      summary: true,
      statusNote: true,
      startDate: true,
      endDate: true,
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  // Works 생성은 인증된 사용자(STAFF/SUPER_ADMIN) 가능
  await requireStaff();
  const {
    name,
    status,
    summary,
    companyId,
    pmId,
    startDate,
    endDate,
    brandColors,
    keywords,
    notes,
    memberUserIds,
    clientUserIds,
  } = await request.json();

  if (!name || !String(name).trim()) {
    return NextResponse.json(
      { error: "Works 이름을 입력해주세요." },
      { status: 400 }
    );
  }

  const staffMembers = (
    Array.isArray(memberUserIds) ? memberUserIds : []
  ).map((userId: string) => ({ userId, roleLabel: "팀원" }));
  const clientMembers = (
    Array.isArray(clientUserIds) ? clientUserIds : []
  ).map((userId: string) => ({ userId, roleLabel: "Client" }));

  const project = await prisma.project.create({
    data: {
      name: String(name).trim(),
      status: status || undefined,
      summary: summary || undefined,
      phases: ["진행"],
      companyId: companyId || undefined,
      pmId: pmId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      brandColors: Array.isArray(brandColors) ? brandColors : [],
      keywords: Array.isArray(keywords) ? keywords : [],
      notes: notes || undefined,
      members: {
        create: [...staffMembers, ...clientMembers],
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ project }, { status: 201 });
}
