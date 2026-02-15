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
          "focus:outline-none focus:ring-2 focus:ring-offset-2",

          // Variants
          {
            "bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-hover)] text-[var(--button-primary-text)] focus:ring-[var(--accent)] shadow-sm":
              variant === "primary",
            "bg-[var(--button-secondary-bg)] text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)] focus:ring-[var(--accent)]":
              variant === "secondary",
            "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-1)] focus:ring-[var(--accent)]":
              variant === "outline",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] focus:ring-[var(--accent)]":
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
