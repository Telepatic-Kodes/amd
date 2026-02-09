import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import ConvexClientProvider from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "AI Marketing Department",
  description: "Automated marketing department operated by 37 AI agents",
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
        >
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
