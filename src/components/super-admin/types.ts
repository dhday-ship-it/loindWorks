import type { ProjectStatus, Role } from "@/generated/prisma/enums";

export interface CompanyItem {
  id: string;
  name: string;
  companyId: string;
  contactName: string | null;
  contactEmail: string | null;
  _count: { users: number; projects: number };
}

export interface AdminUserItem {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  company: { id: string; name: string } | null;
  projectMemberships: { project: { id: string; name: string } }[];
}

export interface AdminProjectItem {
  id: string;
  name: string;
  status: ProjectStatus;
  currentPhase: number;
  phaseCount: number;
  startDate: string | null;
  endDate: string | null;
  company: { id: string; name: string } | null;
  pm: { id: string; name: string | null; email: string } | null;
  clientNames: string[];
}

export interface UnhandledRequestItem {
  id: string;
  projectId: string;
  projectName: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface AdminStats {
  activeProjects: number;
  totalProjects: number;
  staffCount: number;
  clientCount: number;
  companyCount: number;
  unhandledCount: number;
  newRequestsThisWeek: number;
}

export interface StaffOption {
  id: string;
  name: string | null;
  email: string;
}
