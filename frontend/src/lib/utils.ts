import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { EUR_XAF_RATE } from "@/lib/constants";
import type { ApiOrder, ApiSourcingRequest, Currency } from "@/types";

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

/** Même formulation que les e-mails automatiques (`notify_order_status_update` côté backend), pour rester cohérent quel que soit le canal. */
function orderStatusMessageFragment(order: ApiOrder): string {
  switch (order.status) {
    case "deposit_paid":
      return "votre acompte a bien été reçu et votre commande est validée";
    case "sourcing_in_progress":
      return "nous finalisons actuellement l'achat de votre pièce en Europe";
    case "shipped_from_europe":
      return "votre colis a quitté l'Europe et est en cours d'acheminement";
    case "arrived_in_cameroon":
      return `votre colis est bien arrivé en agence à ${order.delivery_city}`;
    case "delivered_and_completed":
      return "votre commande a été livrée et soldée — merci de votre confiance";
    default:
      return `votre commande ${order.order_number} a été mise à jour`;
  }
}

/**
 * Contrairement à un e-mail, un message WhatsApp n'a pas d'habillage visuel —
 * la signature textuelle est donc le seul moyen pour le client de savoir que
 * le message provient bien du service client officiel Imperial Collection
 * (numéro +237 6 96 00 03 88), et pas d'un numéro personnel.
 */
const WHATSAPP_SIGNATURE = "— L'équipe Imperial Collection";

/** Message WhatsApp pré-rempli pour le bouton "Avertir sur WhatsApp" du dashboard admin. */
export function buildOrderWhatsAppMessage(order: ApiOrder, trackingUrl: string): string {
  const firstName = order.customer_name.split(" ")[0] || order.customer_name;
  const remaining = Number(order.amount_remaining_xaf);
  const parts = [`Bonjour ${firstName}, ${orderStatusMessageFragment(order)}.`];
  if (remaining > 0) {
    parts.push(`Le solde restant est de ${formatXAF(remaining)}.`);
  }
  parts.push(`Voici votre lien de suivi : ${trackingUrl}`);
  parts.push(WHATSAPP_SIGNATURE);
  return parts.join(" ");
}

export function buildSourcingWhatsAppMessage(request: ApiSourcingRequest): string {
  const firstName = request.customer_name.split(" ")[0] || request.customer_name;
  const article = request.product_name || "l'article recherché";
  const parts = [`Bonjour ${firstName},`];
  if (request.quoted_price_xaf) {
    parts.push(
      `bonne nouvelle : nous avons trouvé « ${article} » au prix de ${formatXAF(Number(request.quoted_price_xaf))}.`,
      "Connectez-vous à votre espace client pour valider la commande et régler l'acompte."
    );
  } else {
    parts.push(`nous revenons vers vous au sujet de votre demande de sourcing pour « ${article} ».`);
  }
  parts.push(WHATSAPP_SIGNATURE);
  return parts.join(" ");
}

/** `phoneNumber` peut contenir des espaces/indicatif avec "+" — seuls les chiffres sont conservés, comme l'exige l'API `wa.me`. */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Reformate un numéro Mobile Money camerounais au fil de la saisie
 * (`+237 6XX XXX XXX`) — l'utilisateur peut taper ou coller n'importe quel
 * format (avec ou sans indicatif, espaces, tirets…), seuls les chiffres
 * comptent : on retire un éventuel "237" déjà présent en tête pour ne
 * jamais le dupliquer, puis on regroupe les 9 chiffres restants par 3.
 */
export function formatCameroonPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  const local = (digits.startsWith("237") ? digits.slice(3) : digits).slice(0, 9);
  if (!local) return "";
  const groups = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 9)].filter(Boolean);
  return `+237 ${groups.join(" ")}`;
}
