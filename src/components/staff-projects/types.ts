import type {
  LogType,
  ProjectStatus,
  RequestStatus,
} from "@/generated/prisma/enums";
import type { Person, CalendarEventItem } from "@/components/calendar/types";

export type { Person, CalendarEventItem };

export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  summary: string | null;
  statusNote: string | null;
}

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

export interface ProjectRequestItem {
  id: string;
  title: string | null;
  body: string;
  createdAt: string;
  author: Person;
  assignees: RequestAssigneeItem[];
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
  edits: ActivityLogEdit[];
  createdAt: string;
  author: Person;
}

export interface CompanyRef {
  id: string;
  name: string;
  companyId: string;
  contactName: string | null;
  contactEmail: string | null;
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
  requests: ProjectRequestItem[];
  logs: ActivityLogItem[];
  calendarEvents: CalendarEventItem[];
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
