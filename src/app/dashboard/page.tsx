import { requireUser } from "@/lib/auth-guards";
import { getHomeData } from "@/lib/staff-home-data";
import { StaffHome } from "@/components/staff-home/StaffHome";

export default async function DashboardPage() {
  const user = await requireUser();
  const { works, events } = await getHomeData(user.id, user.role);

  return (
    <StaffHome
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.role,
      }}
      initialWorks={works}
      initialEvents={events}
    />
  );
}
