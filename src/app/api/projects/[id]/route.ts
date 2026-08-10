import { NextResponse } from "next/server";

import { requireStaff, requireSuperAdmin, requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/generated/prisma/enums";

const PROJECT_STATUSES: ProjectStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;

  if (user.role === "CLIENT") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
  } else if (user.role !== "STAFF" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      company: true,
      pm: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      requests: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      logs: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      calendarEvents: {
        orderBy: { startAt: "asc" },
        include: { owner: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const { currentPhase, status } = await request.json();

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { phases: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const data: { currentPhase?: number; status?: ProjectStatus } = {};

  if (currentPhase !== undefined) {
    const phaseCount = (existing.phases as string[]).length;
    if (
      typeof currentPhase !== "number" ||
      !Number.isInteger(currentPhase) ||
      currentPhase < 0 ||
      currentPhase > phaseCount - 1
    ) {
      return NextResponse.json(
        { error: "유효하지 않은 단계입니다." },
        { status: 400 }
      );
    }
    data.currentPhase = currentPhase;
  }

  if (status !== undefined) {
    if (!PROJECT_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "유효하지 않은 상태입니다." },
        { status: 400 }
      );
    }
    data.status = status;
  }

  const project = await prisma.project.update({ where: { id }, data });

  return NextResponse.json({
    project: { id: project.id, currentPhase: project.currentPhase, status: project.status },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
