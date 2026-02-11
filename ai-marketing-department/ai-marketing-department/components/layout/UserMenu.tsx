"use client";

import { UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";

const DEV_AUTH_BYPASS =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export function UserMenu() {
  if (DEV_AUTH_BYPASS) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
          <User className="w-4 h-4 text-stone-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <UserButton
        afterSignOutUrl="/sign-in"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
            userButtonPopoverCard: "bg-white border border-stone-200",
            userButtonPopoverActionButton: "text-stone-600 hover:text-stone-900",
            userButtonPopoverActionButtonText: "text-stone-600",
            userButtonPopoverFooter: "hidden",
          },
        }}
      />
    </div>
  );
}
