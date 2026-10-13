import { requireUser } from "@/lib/auth-guards";
import { ArtisanOrdersWorkstationPage } from "@/components/staff-home/ArtisanOrdersWorkstationPage";

export default async function DashboardArtisanPage() {
  const user = await requireUser();

  return (
    <ArtisanOrdersWorkstationPage
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.role,
      }}
    />
  );
}
