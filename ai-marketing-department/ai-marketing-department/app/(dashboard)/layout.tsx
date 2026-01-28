import type { Metadata } from "next";
import { LayoutShell } from "@/components/layout/LayoutShell";

export const metadata: Metadata = {
  title: "AI Marketing Department - Dashboard",
  description: "Automated marketing department operated by 37 AI agents",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Route groups NO deben tener tags <html> o <body>
  // Estos se heredan del layout raíz (app/layout.tsx)
  return <LayoutShell>{children}</LayoutShell>;
}
