import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AMD - Tu Departamento de Marketing Automatizado con 37 Agentes IA",
  description: "Automatiza contenido, SEO, social media y ads con 37 agentes especializados. Ahorra hasta $450k/año. Setup en 5 minutos.",
  keywords: "marketing automation, AI agents, content marketing, SEO, social media",
  openGraph: {
    title: "AMD - Departamento de Marketing con IA",
    description: "37 agentes de IA ejecutan tu marketing 24/7",
    type: "website",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Route groups NO deben tener tags <html> o <body>
  // Estos se heredan del layout raíz (app/layout.tsx)
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
