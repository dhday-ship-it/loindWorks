import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireStaff();

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      summary: true,
      statusNote: true,
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  await requireStaff();
  const {
    name,
    status,
    summary,
    phases,
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

  if (!name || !Array.isArray(phases) || phases.length === 0) {
    return NextResponse.json(
      { error: "프로젝트명과 최소 1개 이상의 단계가 필요합니다." },
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
      name,
      status: status || undefined,
      summary: summary || undefined,
      phases,
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
