import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { validateEnvironment } from "@/lib/validateEnv";
import "./globals.css";
import "./luxury-overrides.css";

// Server-side startup validation (runs at build time and server start)
validateEnvironment();

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

import ConvexClientProvider from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "AI Marketing Department",
  description: "Automated marketing department operated by 37 AI agents",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#faf8f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ cssLayerName: 'clerk' }}>
      <html lang="es">
        <body
          className={`${playfair.variable} ${dmSans.variable} ${jetbrains.variable} antialiased font-[family-name:var(--font-dm-sans)]`}
        >
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
