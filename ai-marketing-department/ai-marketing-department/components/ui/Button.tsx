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
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black",

          // Variants
          {
            "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 focus:ring-indigo-500":
              variant === "primary",
            "bg-zinc-800 text-white hover:bg-zinc-700 focus:ring-zinc-500":
              variant === "secondary",
            "border-2 border-zinc-700 text-white hover:border-zinc-600 hover:bg-zinc-900 focus:ring-zinc-500":
              variant === "outline",
            "text-zinc-400 hover:text-white hover:bg-zinc-900 focus:ring-zinc-500":
              variant === "ghost",
          },

          // Sizes
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
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
