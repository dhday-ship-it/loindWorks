import type { ProjectStatus } from "@/generated/prisma/enums";

export interface ClientProjectCard {
  id: string;
  name: string;
  status: ProjectStatus;
  summary: string | null;
  phases: string[];
  currentPhase: number;
  startDate: string | null;
  endDate: string | null;
  company: { id: string; name: string } | null;
  pm: { id: string; name: string | null; email: string } | null;
}
