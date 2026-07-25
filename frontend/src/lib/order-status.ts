import type { BadgeProps } from "@/components/ui/badge";
import type { ApiSourcingStatus, OrderStatus } from "@/types";

/**
 * `label` reste le libellé français par défaut (consommé tel quel par les écrans non
 * traduits, ex. l'espace client "Mon compte"). `labelKey` est la clé i18n à résoudre via
 * `useTranslation().t(...)` dans les écrans multilingues (checkout, sourcing, admin).
 */
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; labelKey: string; variant: BadgeProps["variant"] }> = {
  pending_deposit: { label: "En attente d'acompte", labelKey: "orderStatus.pending_deposit", variant: "warning" },
  deposit_paid: { label: "Acompte payé", labelKey: "orderStatus.deposit_paid", variant: "info" },
  sourcing_in_progress: {
    label: "Achat en cours en Europe",
    labelKey: "orderStatus.sourcing_in_progress",
    variant: "info",
  },
  shipped_from_europe: {
    label: "Expédié depuis l'Europe",
    labelKey: "orderStatus.shipped_from_europe",
    variant: "gold",
  },
  arrived_in_cameroon: {
    label: "Disponible en agence",
    labelKey: "orderStatus.arrived_in_cameroon",
    variant: "gold",
  },
  delivered_and_completed: {
    label: "Livrée & soldée",
    labelKey: "orderStatus.delivered_and_completed",
    variant: "success",
  },
  cancelled: { label: "Annulée", labelKey: "orderStatus.cancelled", variant: "outline" },
};

/**
 * Accès défensif : si une commande porte en base un statut hérité d'un ancien
 * modèle (ex. après un renommage d'enum côté backend) qui n'a pas encore été
 * migré, on affiche le code brut au lieu de faire planter l'écran entier.
 */
export function getOrderStatusMeta(status: string): { label: string; labelKey: string; variant: BadgeProps["variant"] } {
  return (
    ORDER_STATUS_META[status as OrderStatus] ?? {
      label: status,
      labelKey: "",
      variant: "outline",
    }
  );
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending_deposit",
  "deposit_paid",
  "sourcing_in_progress",
  "shipped_from_europe",
  "arrived_in_cameroon",
  "delivered_and_completed",
  "cancelled",
];

/** Les 5 grandes étapes de la frise (hors "en attente" et "annulée", qui ne font pas partie du parcours logistique). */
export const TRACKING_MILESTONES: OrderStatus[] = [
  "deposit_paid",
  "sourcing_in_progress",
  "shipped_from_europe",
  "arrived_in_cameroon",
  "delivered_and_completed",
];

export const ADMIN_SOURCING_STATUS_META: Record<ApiSourcingStatus, { label: string; labelKey: string; variant: BadgeProps["variant"] }> = {
  new: { label: "Nouvelle demande", labelKey: "adminSourcingStatus.new", variant: "warning" },
  under_review: { label: "En cours d'étude", labelKey: "adminSourcingStatus.under_review", variant: "info" },
  quoted: { label: "Devis envoyé", labelKey: "adminSourcingStatus.quoted", variant: "gold" },
  converted: { label: "Convertie en commande", labelKey: "adminSourcingStatus.converted", variant: "success" },
  rejected: { label: "Non réalisable", labelKey: "adminSourcingStatus.rejected", variant: "outline" },
};
