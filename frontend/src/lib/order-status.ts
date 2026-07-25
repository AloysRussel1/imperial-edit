import type { BadgeProps } from "@/components/ui/badge";
import type { ApiSourcingStatus, OrderStatus, SourcingStatus } from "@/types";

/**
 * `label` reste le libellé français par défaut (consommé tel quel par les écrans non
 * traduits, ex. l'espace client "Mon compte"). `labelKey` est la clé i18n à résoudre via
 * `useTranslation().t(...)` dans les écrans multilingues (checkout, sourcing, admin).
 */
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; labelKey: string; variant: BadgeProps["variant"] }> = {
  pending_deposit: { label: "En attente d'acompte", labelKey: "orderStatus.pending_deposit", variant: "warning" },
  deposit_paid: { label: "Acompte payé", labelKey: "orderStatus.deposit_paid", variant: "info" },
  in_transit: { label: "En cours d'expédition", labelKey: "orderStatus.in_transit", variant: "info" },
  ready_for_delivery: { label: "Prête à livrer", labelKey: "orderStatus.ready_for_delivery", variant: "gold" },
  completed: { label: "Livrée", labelKey: "orderStatus.completed", variant: "success" },
  cancelled: { label: "Annulée", labelKey: "orderStatus.cancelled", variant: "outline" },
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending_deposit",
  "deposit_paid",
  "in_transit",
  "ready_for_delivery",
  "completed",
  "cancelled",
];

export const SOURCING_STATUS_META: Record<SourcingStatus, { label: string; labelKey: string; variant: BadgeProps["variant"] }> = {
  pending: { label: "En cours d'analyse par l'équipe", labelKey: "sourcingStatus.pending", variant: "warning" },
  quoted: { label: "Devis reçu", labelKey: "sourcingStatus.quoted", variant: "info" },
  accepted: { label: "Devis accepté", labelKey: "sourcingStatus.accepted", variant: "success" },
  declined: { label: "Non réalisable", labelKey: "sourcingStatus.declined", variant: "outline" },
};

export const ADMIN_SOURCING_STATUS_META: Record<ApiSourcingStatus, { label: string; labelKey: string; variant: BadgeProps["variant"] }> = {
  new: { label: "Nouvelle demande", labelKey: "adminSourcingStatus.new", variant: "warning" },
  under_review: { label: "En cours d'étude", labelKey: "adminSourcingStatus.under_review", variant: "info" },
  quoted: { label: "Devis envoyé", labelKey: "adminSourcingStatus.quoted", variant: "gold" },
  converted: { label: "Convertie en commande", labelKey: "adminSourcingStatus.converted", variant: "success" },
  rejected: { label: "Non réalisable", labelKey: "adminSourcingStatus.rejected", variant: "outline" },
};
