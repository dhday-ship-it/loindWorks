import { requireUser } from "@/lib/auth-guards";
import { getHomeData } from "@/lib/staff-home-data";
import { CalendarPage } from "@/components/calendar/CalendarPage";

export default async function DashboardCalendarPage() {
  const user = await requireUser();
  const { events } = await getHomeData(user.id, user.role);

  return (
    <CalendarPage
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.role,
      }}
      initialEvents={events}
    />
  );
}
