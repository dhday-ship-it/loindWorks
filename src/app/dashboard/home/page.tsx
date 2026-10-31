import { requireUser } from "@/lib/auth-guards";
import { HomeView } from "@/components/home/HomeView";

export default async function HomePage() {
  const user = await requireUser();

  return (
    <HomeView
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.role,
      }}
    />
  );
}
