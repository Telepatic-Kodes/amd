import { LayoutShell } from "@/components/layout/LayoutShell";
import DashboardPage from "./(dashboard)/page";

export default function RootPage() {
  return (
    <LayoutShell>
      <DashboardPage />
    </LayoutShell>
  );
}
