import type { BadgeProps } from "@/components/ui/badge";
import type { ApiSourcingStatus, OrderStatus, SourcingStatus } from "@/types";

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; variant: BadgeProps["variant"] }> = {
  pending_deposit: { label: "En attente d'acompte", variant: "warning" },
  deposit_paid: { label: "Acompte payé", variant: "info" },
  in_transit: { label: "En cours d'expédition", variant: "info" },
  ready_for_delivery: { label: "Prête à livrer", variant: "gold" },
  completed: { label: "Livrée", variant: "success" },
  cancelled: { label: "Annulée", variant: "outline" },
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending_deposit",
  "deposit_paid",
  "in_transit",
  "ready_for_delivery",
  "completed",
  "cancelled",
];

export const SOURCING_STATUS_META: Record<SourcingStatus, { label: string; variant: BadgeProps["variant"] }> = {
  pending: { label: "En cours d'analyse par l'équipe", variant: "warning" },
  quoted: { label: "Devis reçu", variant: "info" },
  accepted: { label: "Devis accepté", variant: "success" },
  declined: { label: "Non réalisable", variant: "outline" },
};

export const ADMIN_SOURCING_STATUS_META: Record<ApiSourcingStatus, { label: string; variant: BadgeProps["variant"] }> = {
  new: { label: "Nouvelle demande", variant: "warning" },
  under_review: { label: "En cours d'étude", variant: "info" },
  quoted: { label: "Devis envoyé", variant: "gold" },
  converted: { label: "Convertie en commande", variant: "success" },
  rejected: { label: "Non réalisable", variant: "outline" },
};
