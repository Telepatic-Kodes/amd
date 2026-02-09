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
            "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500":
              variant === "primary",
            "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400":
              variant === "secondary",
            "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400":
              variant === "outline",
            "text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-gray-400":
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
