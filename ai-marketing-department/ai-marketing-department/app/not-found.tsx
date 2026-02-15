"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)]">
            <div className="text-center space-y-6">
                <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
                <h1 className="text-4xl font-bold text-[var(--text-primary)]">404</h1>
                <p className="text-lg text-[var(--text-tertiary)]">
                    La página que buscas no existe.
                </p>
                <Link
                    href="/"
                    className="inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent)] transition-colors"
                >
                    Volver al Dashboard
                </Link>
            </div>
        </div>
    );
}
