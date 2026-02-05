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
            userButtonPopoverCard: "bg-zinc-900 border border-zinc-800",
            userButtonPopoverActionButton: "text-zinc-300 hover:text-white",
            userButtonPopoverActionButtonText: "text-zinc-300",
            userButtonPopoverFooter: "hidden",
          },
        }}
      />
    </div>
  );
}
