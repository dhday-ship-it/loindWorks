import { requireUser } from "@/lib/auth-guards";
import { getHomeData } from "@/lib/staff-home-data";
import { ArtisanOrdersWorkstationPage } from "@/components/staff-home/ArtisanOrdersWorkstationPage";

export default async function DashboardArtisanPage() {
  const user = await requireUser();
  const { events } = await getHomeData(user.id, user.role);

  return (
    <ArtisanOrdersWorkstationPage
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
