import { ArtisanOrderWatcher } from "@/components/staff-home/ArtisanOrderWatcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ArtisanOrderWatcher />
    </>
  );
}
