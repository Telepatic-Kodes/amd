"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
            <div className="text-center space-y-6">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                <h1 className="text-4xl font-bold">404 – Page Not Found</h1>
                <p className="text-lg text-stone-400">
                    The page you are looking for does not exist.
                </p>
                <Link
                    href="/"
                    className="inline-block rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
                >
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
