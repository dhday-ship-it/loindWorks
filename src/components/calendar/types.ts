export interface Person {
  id: string;
  name: string | null;
  email: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  startAt: string;
  sharedWith: string[];
  owner: Person;
  projectId?: string | null;
}
