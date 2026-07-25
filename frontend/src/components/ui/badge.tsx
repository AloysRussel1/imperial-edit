import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-imperial-black text-imperial-ivory",
        gold: "border-transparent bg-gold-gradient text-imperial-black",
        outline: "border-imperial-black/20 text-imperial-black",
        "outline-ivory": "border-imperial-ivory/30 text-imperial-ivory",
        sale: "border-transparent bg-red-800 text-imperial-ivory",
        success: "border-transparent bg-emerald-800 text-imperial-ivory",
        warning: "border-transparent bg-amber-600 text-imperial-ivory",
        info: "border-transparent bg-slate-700 text-imperial-ivory",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
