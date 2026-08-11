import type { ProjectStatus, TaskStatus } from "@/generated/prisma/enums";
import type { Person, CalendarEventItem } from "@/components/calendar/types";

export type { Person, CalendarEventItem };

export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
}

export interface TaggedItem {
  id: string;
  kind: "request" | "log";
  title: string;
  projectId: string;
  projectName: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  tag: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  assignee: Person;
  createdBy: Person;
}

export interface MemoFolderItem {
  id: string;
  name: string;
}

export interface MemoItem {
  id: string;
  title: string;
  body: string | null;
  pinned: boolean;
  createdAt: string;
  folder: MemoFolderItem | null;
}
