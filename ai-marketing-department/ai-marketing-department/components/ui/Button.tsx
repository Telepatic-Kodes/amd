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
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white",

          // Variants
          {
            "bg-gradient-to-br from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 focus:ring-orange-500 shadow-sm":
              variant === "primary",
            "bg-stone-100 text-stone-700 hover:bg-stone-200 focus:ring-stone-400":
              variant === "secondary",
            "border border-stone-300 text-stone-700 hover:bg-stone-50 focus:ring-stone-400":
              variant === "outline",
            "text-stone-500 hover:text-stone-700 hover:bg-stone-100 focus:ring-stone-400":
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
