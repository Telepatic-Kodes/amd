"use client";

import { ReactNode } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/Toast";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// DEV BYPASS: skip Clerk auth in development
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    if (DEV_AUTH_BYPASS) {
        return (
            <ConvexProvider client={convex}>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </ConvexProvider>
        );
    }

    return (
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <ToastProvider>
                {children}
            </ToastProvider>
        </ConvexProviderWithClerk>
    );
}
