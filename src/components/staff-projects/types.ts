import type {
  LogType,
  ProjectStatus,
  RequestStatus,
  TaskPriority,
  TaskStatus,
} from "@/generated/prisma/enums";
import type { Person, CalendarEventItem, ProjectSummary } from "@/types/shared";

export type { Person, CalendarEventItem, ProjectSummary };

export interface ProjectMemberItem {
  id: string;
  roleLabel: string;
  user: Person;
}

export interface RequestComment {
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface RequestAssigneeItem {
  id: string;
  status: RequestStatus;
  comments: RequestComment[];
  user: Person;
}

export interface ProjectFileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string | null;
  createdAt: string;
  uploader: Person;
}

export interface ProjectRequestItem {
  id: string;
  title: string | null;
  body: string;
  itemType: string; // "REQUEST" | "TASK"
  createdAt: string;
  author: Person;
  assignees: RequestAssigneeItem[];
  files: ProjectFileItem[];
}

export interface ActivityLogEdit {
  actorId: string;
  actorName: string;
  action: string;
  snapshot: string;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  type: LogType;
  title: string;
  body: string | null;
  withPerson: string | null;
  logDate: string | null;
  taggedUserIds: string[];
  edits: ActivityLogEdit[];
  createdAt: string;
  author: Person;
  files: ProjectFileItem[];
}

export interface CompanyRef {
  id: string;
  name: string;
  companyId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  assignee: Person;
  createdBy: Person;
}

export interface ProjectDetail {
  id: string;
  name: string;
  status: ProjectStatus;
  summary: string | null;
  statusNote: string | null;
  phases: string[];
  currentPhase: number;
  startDate: string | null;
  endDate: string | null;
  company: CompanyRef | null;
  pm: Person | null;
  brandColors: string[];
  keywords: string[];
  notes: string | null;
  members: ProjectMemberItem[];
  tasks: ProjectTaskItem[];
  requests: ProjectRequestItem[];
  logs: ActivityLogItem[];
  calendarEvents: CalendarEventItem[];
  files: ProjectFileItem[];
}

const AVATAR_PALETTE = [
  "#0C0C0E",
  "#4a90d9",
  "#6b7280",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function initials(person: Person) {
  const source = person.name ?? person.email;
  return source.slice(0, 2).toUpperCase();
}
