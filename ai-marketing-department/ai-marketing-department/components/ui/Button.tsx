import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black",

          // Variants
          {
            "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 focus:ring-indigo-500":
              variant === "primary",
            "bg-zinc-800 text-white hover:bg-zinc-700 focus:ring-zinc-500":
              variant === "secondary",
            "border-2 border-zinc-700 text-white hover:border-zinc-600 hover:bg-zinc-900 focus:ring-zinc-500":
              variant === "outline",
            "text-zinc-400 hover:text-white hover:bg-zinc-900 focus:ring-zinc-500":
              variant === "ghost",
          },

          // Sizes (with WCAG 44x44px touch target compliance)
          {
            "px-3 py-1.5 text-sm min-h-[44px]": size === "sm",
            "px-6 py-3 text-base min-h-[44px]": size === "md",
            "px-8 py-4 text-lg min-h-[44px]": size === "lg",
          },

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
