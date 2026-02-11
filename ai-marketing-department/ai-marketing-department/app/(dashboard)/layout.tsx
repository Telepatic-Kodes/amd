import type { Metadata } from "next";
import { LayoutShell } from "@/components/layout/LayoutShell";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | AMD",
  },
  description: "Departamento de marketing automatizado con 37 agentes IA",
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
