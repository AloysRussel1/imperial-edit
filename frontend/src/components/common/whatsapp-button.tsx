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
  message = "Bonjour, je souhaite en savoir plus sur The Imperial Edit.",
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
        aria-label="Contacter The Imperial Edit sur WhatsApp"
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elevated transition-transform hover:scale-105",
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
