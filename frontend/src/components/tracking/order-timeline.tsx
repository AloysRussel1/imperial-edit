import { CheckCircle2, CreditCard, PackageCheck, Plane, Search } from "lucide-react";

import { Price } from "@/components/common/price";
import { cn } from "@/lib/utils";
import type { ApiOrderStatus, ApiOrderStatusHistoryEntry } from "@/types";

const MILESTONES: { status: ApiOrderStatus; label: string; icon: typeof CreditCard }[] = [
  { status: "deposit_paid", label: "Acompte payé & commande validée", icon: CreditCard },
  { status: "sourcing_in_progress", label: "Achat en cours en Europe", icon: Search },
  { status: "shipped_from_europe", label: "Expédié depuis l'Europe", icon: Plane },
  { status: "arrived_in_cameroon", label: "Disponible en agence", icon: PackageCheck },
  { status: "delivered_and_completed", label: "Livré & soldé", icon: CheckCircle2 },
];

/** Sous-ensemble commun à `ApiOrder` et `ApiOrderTracking` (dashboard client vs. suivi public). */
export interface OrderTimelineData {
  order_number: string;
  tracking_number: string | null;
  status: ApiOrderStatus;
  status_display: string;
  tracking_progress_percent: number;
  delivery_city: string;
  shipping_address: string;
  deposit_percentage: 50 | 70 | 100;
  total_xaf: string;
  amount_paid_xaf: string;
  amount_remaining_xaf: string;
  estimated_delivery_date: string | null;
  status_history: ApiOrderStatusHistoryEntry[];
}

export function OrderTimeline({ order }: { order: OrderTimelineData }) {
  const currentIndex = MILESTONES.findIndex((m) => m.status === order.status);
  const noteByStatus = new Map(
    order.status_history.filter((entry) => entry.note).map((entry) => [entry.status, entry.note])
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-imperial-gold/25 bg-gradient-to-b from-imperial-charcoal to-imperial-black text-imperial-ivory shadow-elevated">
      <div className="border-b border-imperial-ivory/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-imperial-gold">Numéro de suivi</p>
            <p className="mt-1 font-display text-2xl tracking-wide">{order.tracking_number ?? order.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest2 text-imperial-ivory/50">Statut actuel</p>
            <p className="mt-1 font-medium text-imperial-gold">{order.status_display}</p>
          </div>
        </div>

        {order.status !== "cancelled" ? (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-imperial-ivory/50">
              <span>Progression</span>
              <span className="tabular-nums">{order.tracking_progress_percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-imperial-ivory/10">
              <div
                className="h-full rounded-full bg-gold-gradient transition-all duration-500"
                style={{ width: `${order.tracking_progress_percent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {order.status === "cancelled" ? (
        <div className="p-6 text-center text-imperial-ivory/70 sm:p-8">
          Cette commande a été annulée. Contactez-nous si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
        </div>
      ) : (
        <ol className="space-y-0 p-6 sm:p-8">
          {MILESTONES.map((milestone, index) => {
            const isDone = currentIndex > index;
            const isCurrent = currentIndex === index;
            const isUpcoming = currentIndex < index;
            const note = noteByStatus.get(milestone.status);
            const Icon = milestone.icon;

            return (
              <li key={milestone.status} className="relative flex gap-4 pb-8 last:pb-0">
                {index < MILESTONES.length - 1 ? (
                  <span
                    className={cn(
                      "absolute left-5 top-10 h-[calc(100%-1.5rem)] w-px",
                      isDone ? "bg-imperial-gold" : "bg-imperial-ivory/15"
                    )}
                  />
                ) : null}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isDone && "border-imperial-gold bg-imperial-gold text-imperial-black",
                    isCurrent && "border-imperial-gold text-imperial-gold shadow-gold",
                    isUpcoming && "border-imperial-ivory/20 text-imperial-ivory/30"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 pt-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isUpcoming ? "text-imperial-ivory/40" : "text-imperial-ivory"
                    )}
                  >
                    {milestone.label}
                  </p>
                  {note && !isUpcoming ? (
                    <p className="mt-1 text-xs text-imperial-gold/80">{note}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid grid-cols-1 gap-4 border-t border-imperial-ivory/10 bg-imperial-black/40 p-6 text-sm sm:grid-cols-2 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-widest2 text-imperial-ivory/50">
            {["Douala", "Yaoundé"].includes(order.delivery_city) ? "Agence de retrait" : "Adresse de livraison"}
          </p>
          <p className="mt-1 text-imperial-ivory">{order.shipping_address || order.delivery_city || "—"}</p>
          {order.delivery_city ? <p className="text-imperial-ivory/60">{order.delivery_city}</p> : null}
          {order.estimated_delivery_date ? (
            <p className="mt-2 text-xs text-imperial-ivory/50">
              Livraison estimée :{" "}
              <span className="text-imperial-ivory">
                {new Date(order.estimated_delivery_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          ) : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs uppercase tracking-widest2 text-imperial-ivory/50">
            Acompte réglé ({order.deposit_percentage}%)
          </p>
          <Price amountXaf={Number(order.amount_paid_xaf)} className="mt-1 block font-semibold text-imperial-gold" />
          <p className="mt-2 text-xs uppercase tracking-widest2 text-imperial-ivory/50">
            Solde restant à la livraison
          </p>
          <Price amountXaf={Number(order.amount_remaining_xaf)} className="mt-1 block font-semibold text-imperial-ivory" />
        </div>
      </div>
    </div>
  );
}
