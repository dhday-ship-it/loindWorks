import type { ProjectStatus } from "@/generated/prisma/enums";

export interface Person {
  id: string;
  name: string | null;
  email: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  sharedWith: string[];
  owner: Person;
  projectId?: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  summary?: string | null;
  statusNote?: string | null;
}
