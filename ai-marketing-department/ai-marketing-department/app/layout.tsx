import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

import { Sidebar } from "@/components/layout/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <ConvexClientProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 pl-64">
              <div className="container mx-auto p-8 max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
