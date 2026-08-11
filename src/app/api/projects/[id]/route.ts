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
          files: {
            include: { uploader: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      logs: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          files: {
            include: { uploader: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      calendarEvents: {
        orderBy: { startAt: "asc" },
        include: { owner: { select: { id: true, name: true, email: true } } },
      },
      files: {
        where: { requestId: null, logId: null },
        orderBy: { createdAt: "desc" },
        include: { uploader: { select: { id: true, name: true, email: true } } },
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
  const {
    currentPhase,
    status,
    name,
    companyId,
    pmId,
    startDate,
    endDate,
    phases,
    memberUserIds,
  } = await request.json();

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { phases: true, currentPhase: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const data: {
    currentPhase?: number;
    status?: ProjectStatus;
    name?: string;
    companyId?: string | null;
    pmId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    phases?: string[];
  } = {};

  if (phases !== undefined) {
    if (!Array.isArray(phases) || phases.length === 0) {
      return NextResponse.json(
        { error: "최소 1개 이상의 단계가 필요합니다." },
        { status: 400 }
      );
    }
    data.phases = phases;
  }

  const phaseCount = data.phases
    ? data.phases.length
    : (existing.phases as string[]).length;

  if (currentPhase !== undefined) {
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
  } else if (data.phases && existing.currentPhase > phaseCount - 1) {
    data.currentPhase = phaseCount - 1;
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

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "프로젝트명을 입력해주세요." },
        { status: 400 }
      );
    }
    data.name = name.trim();
  }

  if (companyId !== undefined) data.companyId = companyId || null;
  if (pmId !== undefined) data.pmId = pmId || null;
  if (startDate !== undefined)
    data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

  if (Array.isArray(memberUserIds)) {
    await prisma.projectMember.deleteMany({
      where: { projectId: id, roleLabel: "팀원" },
    });
    if (memberUserIds.length > 0) {
      await prisma.projectMember.createMany({
        data: memberUserIds.map((userId: string) => ({
          projectId: id,
          userId,
          roleLabel: "팀원",
        })),
        skipDuplicates: true,
      });
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data,
    include: {
      company: true,
      pm: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      currentPhase: project.currentPhase,
      phaseCount: (project.phases as string[]).length,
      startDate: project.startDate,
      endDate: project.endDate,
      company: project.company
        ? { id: project.company.id, name: project.company.name }
        : null,
      pm: project.pm,
    },
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
