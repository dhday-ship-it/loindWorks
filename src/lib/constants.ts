import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  WAIT: "대기",
  IN_PROGRESS: "진행",
  REVIEW: "검토",
  FEEDBACK: "피드백",
  DONE: "완료",
};

export const STATUS_STYLE: Record<TaskStatus, string> = {
  WAIT: "badge-wait",
  IN_PROGRESS: "badge-progress",
  REVIEW: "badge-review",
  FEEDBACK: "badge-feedback",
  DONE: "badge-done",
};

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH: "bg-[#c9595a]",
  NORMAL: "bg-[#8fa8c4]",
  LOW: "bg-white/20",
};

export const STATUS_ORDER: TaskStatus[] = [
  "WAIT",
  "IN_PROGRESS",
  "REVIEW",
  "FEEDBACK",
  "DONE",
];
