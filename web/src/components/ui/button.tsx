import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        gold: "bg-gradient-to-br from-gold to-gold-dark text-charcoal shadow-[0_4px_18px_rgba(212,168,67,0.28)] hover:-translate-y-0.5 hover:shadow-[0_7px_28px_rgba(212,168,67,0.42)]",
        outline:
          "border border-line text-cream bg-transparent hover:border-gold hover:text-gold",
        ghost: "text-warm hover:text-cream hover:bg-white/5",
      },
      size: {
        sm: "px-4 py-2 text-[13px]",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base",
      },
    },
    defaultVariants: { variant: "gold", size: "md" },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonVariants };
