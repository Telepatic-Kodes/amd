"use client";

import { UserButton } from "@clerk/nextjs";

export function UserMenu() {
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
