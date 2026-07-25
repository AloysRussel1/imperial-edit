"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { fetchOrder } from "@/lib/api";
import { ORDER_STATUS_META } from "@/lib/order-status";
import type { ApiOrder } from "@/types";

export function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const number = searchParams.get("number");

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    fetchOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id && !number) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <p className="text-imperial-black/60">Aucune commande à afficher.</p>
        <Button asChild variant="gold">
          <Link href="/products">Découvrir le catalogue</Link>
        </Button>
      </div>
    );
  }

  const statusMeta = order ? ORDER_STATUS_META[order.status] : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-lg border border-imperial-gold/30 bg-imperial-gold/5 p-8 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-imperial-gold" strokeWidth={1.5} />
      <div>
        <h1 className="font-display text-2xl text-imperial-black">Commande confirmée</h1>
        <p className="mt-1 text-sm text-imperial-black/60">Merci, votre commande a bien été enregistrée.</p>
      </div>

      <div className="rounded-lg border border-imperial-black/10 bg-white p-5 text-left text-sm">
        <div className="flex items-center justify-between">
          <span className="text-imperial-black/50">Numéro de suivi</span>
          <span className="font-semibold text-imperial-black">{order?.order_number ?? number}</span>
        </div>

        {loading ? (
          <p className="mt-3 text-imperial-black/45">Chargement des détails…</p>
        ) : order ? (
          <>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-imperial-black/50">Statut</span>
              {statusMeta ? <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge> : null}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-imperial-black/50">Livraison</span>
              <span className="text-imperial-black">{order.delivery_city}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-imperial-black/10 pt-2">
              <span className="text-imperial-black/50">Montant réglé</span>
              <Price amountXaf={Number(order.amount_paid_xaf)} className="font-semibold text-imperial-gold" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-imperial-black/50">Solde dû à la livraison</span>
              <Price amountXaf={Number(order.amount_remaining_xaf)} className="text-imperial-black" />
            </div>
          </>
        ) : (
          <p className="mt-3 text-imperial-black/45">
            Détails indisponibles pour le moment — retrouvez votre commande dans votre espace client.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild variant="gold">
          <Link href="/dashboard">Suivre ma commande</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Poursuivre mes achats</Link>
        </Button>
      </div>
    </div>
  );
}
