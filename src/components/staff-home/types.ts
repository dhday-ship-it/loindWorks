import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import type { Person, CalendarEventItem, ProjectSummary } from "@/types/shared";

export type { Person, CalendarEventItem, ProjectSummary };

export interface TaggedItem {
  id: string;
  kind: "request" | "log";
  title: string;
  projectId: string | null;
  projectName: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null;
  createdAt: string;
  taskId: string | null;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  order: number;
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
