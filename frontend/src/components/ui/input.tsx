import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // `text-base` (16px) sous `sm:` : en dessous de ce seuil, Safari iOS
        // zoome automatiquement la page au focus d'un champ — `h-11` (44px)
        // avant `sm:` vise la cible tactile minimale recommandée (Apple HIG/
        // Material). Redescend à la taille d'origine (`h-10`/`text-sm`) à
        // partir de `sm:`, où le clavier tactile n'est plus la norme.
        "flex h-11 w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-base text-imperial-black placeholder:text-imperial-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
