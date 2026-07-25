import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { EUR_XAF_RATE } from "@/lib/constants";
import type { Currency } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXAF(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} XAF`;
}

/** Convertit et formate un montant (exprimé en XAF) dans la devise choisie. */
export function formatPrice(amountXaf: number, currency: Currency = "XAF"): string {
  if (currency === "EUR") {
    const eur = amountXaf / EUR_XAF_RATE;
    return `${eur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
  return `${Math.round(amountXaf).toLocaleString("fr-FR")} FCFA`;
}

export function buildWhatsAppLink(phoneNumber: string, orderNumber: string, status: string): string {
  const message = encodeURIComponent(
    `Bonjour, concernant votre commande ${orderNumber} (statut: ${status}) chez The Imperial Edit.`
  );
  return `https://wa.me/${phoneNumber}?text=${message}`;
}
