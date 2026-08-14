import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";

import { buildWhatsAppMessageLink } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  message?: string;
  className?: string;
  variant?: "floating" | "inline";
  children?: ReactNode;
}

export function WhatsAppButton({
  message = "Bonjour, je souhaite en savoir plus sur The Imperial Collection.",
  className,
  variant = "inline",
  children,
}: WhatsAppButtonProps) {
  const href = buildWhatsAppMessageLink(message);

  if (variant === "floating") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter The Imperial Collection sur WhatsApp"
        className={cn(
          // Décalé plus haut sous lg : sur mobile/tablette, la fiche produit
          // affiche une barre d'achat fixe en bas d'écran (voir PurchasePanel)
          // qui occuperait sinon le même espace que ce bouton flottant.
          "fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elevated transition-transform hover:scale-105 sm:right-6 lg:bottom-6 lg:h-14 lg:w-14",
          className
        )}
      >
        <MessageCircle className="h-7 w-7" strokeWidth={1.75} />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-2 text-sm hover:text-imperial-gold", className)}
    >
      <MessageCircle className="h-4 w-4" />
      {children ?? "Contacter sur WhatsApp"}
    </a>
  );
}
