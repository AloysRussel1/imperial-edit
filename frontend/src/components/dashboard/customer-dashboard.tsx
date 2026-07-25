"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, PackageSearch, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { PayBalanceDialog } from "@/components/dashboard/pay-balance-dialog";
import { fetchAllOrders, fetchAllSourcingRequests } from "@/lib/api";
import { ADMIN_SOURCING_STATUS_META, ORDER_STATUS_META } from "@/lib/order-status";
import { useAuthStore } from "@/store/auth-store";
import type { ApiOrder, ApiSourcingRequest } from "@/types";

/**
 * Ces deux appels ciblent les mêmes endpoints que le dashboard admin
 * (`/api/orders/`, `/api/sourcing/requests/`) : le backend restreint déjà le
 * résultat aux seules ressources du `request.user` courant lorsque son rôle
 * n'est pas "admin" (voir `list_orders_for_customer` / `get_queryset`). Chaque
 * compte ne voit donc que ses propres commandes et demandes.
 */
export function CustomerDashboard() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state._hasHydrated);

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [requests, setRequests] = useState<ApiSourcingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [ordersData, requestsData] = await Promise.all([fetchAllOrders(), fetchAllSourcingRequests()]);
      setOrders(ordersData);
      setRequests(requestsData);
    } catch {
      setError("Impossible de charger vos données pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAll();
    } else {
      setLoading(false);
    }
  }, [user, loadAll]);

  if (!hydrated) {
    return null;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <p className="text-imperial-black/70">Connectez-vous pour retrouver vos commandes et demandes de sourcing.</p>
        <Button asChild variant="gold">
          <Link href="/login?next=/dashboard">Se connecter</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-imperial-black/50">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement de votre espace…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="outline" onClick={loadAll}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="mb-5 font-display text-2xl text-imperial-black">Historique des commandes</h2>
        {orders.length === 0 ? (
          <div className="rounded-lg border border-imperial-black/10 bg-white p-10 text-center text-imperial-black/50">
            <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-imperial-black/25" />
            <p>Aucune commande pour le moment.</p>
            <Button asChild variant="gold" className="mt-4">
              <Link href="/products">Découvrir le catalogue</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusMeta = ORDER_STATUS_META[order.status];
              const remaining = Number(order.amount_remaining_xaf);
              return (
                <div key={order.id} className="rounded-lg border border-imperial-black/10 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-imperial-black">{order.order_number}</p>
                      <p className="text-xs text-imperial-black/45">
                        {new Date(order.created_at).toLocaleDateString("fr-FR")} · {order.delivery_city}
                      </p>
                    </div>
                    <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex-1">
                          <p className="text-imperial-black">{item.product_name_snapshot}</p>
                          <p className="text-xs text-imperial-black/45">x{item.quantity}</p>
                        </div>
                        <Price amountXaf={Number(item.line_total_xaf)} className="text-imperial-black/70" />
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-imperial-black/10 pt-4">
                    <p className="text-sm text-imperial-black/50">
                      Payé : <Price amountXaf={Number(order.amount_paid_xaf)} className="font-medium text-imperial-black" />
                      {" · "}
                      Solde : <Price amountXaf={remaining} className="font-medium text-imperial-black" />
                    </p>
                    {remaining > 0 && order.status !== "cancelled" ? (
                      <PayBalanceDialog order={order} onSettled={loadAll} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-5 font-display text-2xl text-imperial-black">Mes demandes de Sourcing</h2>
        {requests.length === 0 ? (
          <div className="rounded-lg border border-imperial-black/10 bg-white p-10 text-center text-imperial-black/50">
            <PackageSearch className="mx-auto mb-3 h-8 w-8 text-imperial-black/25" />
            <p>Aucune demande de sourcing pour le moment.</p>
            <Button asChild variant="gold" className="mt-4">
              <Link href="/sourcing">Faire une demande</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {requests.map((request) => {
              const statusMeta = ADMIN_SOURCING_STATUS_META[request.status];
              return (
                <div key={request.id} className="flex gap-4 rounded-lg border border-imperial-black/10 bg-white p-5">
                  {request.reference_image ? (
                    <Image
                      src={request.reference_image}
                      alt={request.product_name || "Article recherché"}
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <PlaceholderImage hue={30} className="h-16 w-16 shrink-0 rounded-md" iconClassName="h-5 w-5" />
                  )}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-imperial-black">
                        {request.product_name || "Article recherché"}
                      </p>
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </div>
                    <p className="text-xs text-imperial-black/45">
                      {new Date(request.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-sm text-imperial-black/60 line-clamp-2">{request.description}</p>
                    {request.quoted_price_xaf ? (
                      <p className="text-sm">
                        Devis reçu :{" "}
                        <Price amountXaf={Number(request.quoted_price_xaf)} className="font-semibold text-imperial-gold" />
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
