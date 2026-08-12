import type { ProjectStatus, Role, TaxType } from "@/generated/prisma/enums";

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
  memberNames: string[];
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
  pmCount: number;
  companyCount: number;
  unhandledCount: number;
  newRequestsThisWeek: number;
}

export interface StaffOption {
  id: string;
  name: string | null;
  email: string;
}

export interface ContactProjectInquiry {
  category: string;
  purpose: string;
  painPoint: string;
  targetAudience: string;
  successCriteria: string;
  launchDate: string;
  budget: string;
}

export interface ContactRequestItem {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  projects: ContactProjectInquiry[];
  handled: boolean;
  createdAt: string;
}

export interface ProjectRecordItem {
  id: string;
  date: string;
  title: string;
  note: string | null;
  amount: number | null;
  taxType: TaxType;
  advancePayment: number | null;
  balance: number | null;
  settled: boolean;
  taxInvoiceIssued: boolean;
  outsourced: boolean;
  outsourceVendor: string | null;
  outsourceTotalAmount: number | null;
  outsourceTaxType: TaxType;
  outsourcePayment: number | null;
  outsourceBalanceSettled: boolean;
  outsourceTaxInvoiceIssued: boolean;
  projectId: string;
  project: { id: string; name: string };
  createdAt: string;
  author: { id: string; name: string | null; email: string };
}
