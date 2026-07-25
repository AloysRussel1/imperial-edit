"use client";

import Image from "next/image";
import Link from "next/link";
import { PackageSearch, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { PayBalanceDialog } from "@/components/dashboard/pay-balance-dialog";
import { ORDER_STATUS_META, SOURCING_STATUS_META } from "@/lib/order-status";
import { useOrdersStore } from "@/store/orders-store";
import { useSourcingStore } from "@/store/sourcing-store";

export function CustomerDashboard() {
  const orders = useOrdersStore((state) => state.orders);
  const requests = useSourcingStore((state) => state.requests);

  return (
    <div className="space-y-14">
      <section>
        <h2 className="mb-5 font-display text-2xl text-imperial-black">Historique des commandes</h2>
        {orders.length === 0 ? (
          <div className="rounded-lg border border-imperial-black/10 bg-white p-10 text-center text-imperial-black/50">
            <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-imperial-black/25" />
            <p>Vous n&apos;avez pas encore de commande.</p>
            <Button asChild variant="gold" className="mt-4">
              <Link href="/products">Découvrir le catalogue</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusMeta = ORDER_STATUS_META[order.status];
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
                      <li key={`${order.id}-${item.productSlug}-${item.size}-${item.color}`} className="flex items-center gap-3 text-sm">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-imperial-ivory">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} fill sizes="40px" className="object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="text-imperial-black">{item.name}</p>
                          <p className="text-xs text-imperial-black/45">
                            {item.size} · {item.color} · x{item.quantity}
                          </p>
                        </div>
                        <Price amountXaf={item.unitPriceXaf * item.quantity} className="text-imperial-black/70" />
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-imperial-black/10 pt-4">
                    <div className="text-sm">
                      <p className="text-imperial-black/50">
                        Payé : <Price amountXaf={order.amount_paid_xaf} className="font-medium text-imperial-black" />
                        {" · "}
                        Solde : <Price amountXaf={order.amount_remaining_xaf} className="font-medium text-imperial-black" />
                      </p>
                    </div>
                    {order.amount_remaining_xaf > 0 && order.status !== "cancelled" ? (
                      <PayBalanceDialog order={order} />
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
              const statusMeta = SOURCING_STATUS_META[request.status];
              return (
                <div key={request.id} className="flex gap-4 rounded-lg border border-imperial-black/10 bg-white p-5">
                  {request.image_data_url ? (
                    <Image
                      src={request.image_data_url}
                      alt={request.product_name || "Article recherché"}
                      width={64}
                      height={64}
                      unoptimized
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
                    {request.status === "quoted" && request.quoted_price_xaf ? (
                      <p className="text-sm">
                        Devis reçu :{" "}
                        <Price amountXaf={request.quoted_price_xaf} className="font-semibold text-imperial-gold" />
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
