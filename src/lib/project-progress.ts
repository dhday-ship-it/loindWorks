import type { ProjectStatus } from "@/generated/prisma/enums";

export function progressPercent(
  status: ProjectStatus,
  currentPhase: number,
  phaseCount: number
) {
  if (status === "DONE") return 100;
  if (phaseCount === 0) return 0;
  return Math.round((currentPhase / phaseCount) * 100);
}
