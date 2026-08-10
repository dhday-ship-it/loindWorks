import type { TaskStatus } from "@/generated/prisma/enums";
import type { Person, CalendarEventItem } from "@/components/calendar/types";

export type { Person, CalendarEventItem };

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
