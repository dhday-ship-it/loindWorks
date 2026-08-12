export interface Person {
  id: string;
  name: string | null;
  email: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  sharedWith: string[];
  owner: Person;
  projectId?: string | null;
}
