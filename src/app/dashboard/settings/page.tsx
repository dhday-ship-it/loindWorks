import { requireUser } from "@/lib/auth-guards";
import { AccountSettings } from "@/components/account/AccountSettings";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <AccountSettings
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.role,
      }}
    />
  );
}
