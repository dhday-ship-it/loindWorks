import type { Person } from "@/types/shared";

export type { Person };

export interface RequestEntryItem {
  id: string;
  title: string;
  body: string | null;
  logDate: string;
  author: Person;
}
