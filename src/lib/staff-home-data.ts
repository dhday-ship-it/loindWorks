import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

export async function getHomeData(_userId: string, _role: Role) {
  // 모든 인증 사용자가 전체 Works를 조회할 수 있다.
  const works = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  return {
    works: works.map((w) => ({
      ...w,
      startDate: w.startDate ? w.startDate.toISOString() : null,
      endDate: w.endDate ? w.endDate.toISOString() : null,
    })),
  };
}
