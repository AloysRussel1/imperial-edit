"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, Timer, Truck } from "lucide-react";

import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { fetchProducts } from "@/lib/api";
import type { ProductDetail } from "@/types";

function useCountdownToMidnight() {
  const [label, setLabel] = useState("--:--:--");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / 3_600_000);
      const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
      const seconds = Math.floor((diffMs % 60_000) / 1000);
      setLabel(`${String(hours).padStart(2, "0")}h : ${String(minutes).padStart(2, "0")}m : ${String(seconds).padStart(2, "0")}s`);
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return label;
}

/** Colonne de droite du Hero : offre du jour (produit réel, décompte jusqu'à
 * minuit) + carte de réassurance livraison/paiement. */
export function HeroPromoCards() {
  const [deal, setDeal] = useState<ProductDetail | null>(null);
  const countdown = useCountdownToMidnight();

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((products) => {
        if (cancelled) return;
        const onSale = products.filter((p) => p.is_on_sale);
        const pick = onSale[0] ?? products.find((p) => p.is_featured) ?? products[0] ?? null;
        setDeal(pick);
      })
      .catch(() => {
        if (!cancelled) setDeal(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-imperial-gold/30 bg-imperial-black text-imperial-ivory">
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="text-xs uppercase tracking-widest2 text-imperial-gold">Offre du jour</p>
          <span className="flex items-center gap-1.5 text-xs text-imperial-ivory/70">
            <Timer className="h-3.5 w-3.5 text-imperial-gold" strokeWidth={1.75} />
            {countdown}
          </span>
        </div>

        {deal ? (
          <Link href={`/products/${deal.slug}`} className="group flex flex-1 flex-col">
            <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden bg-imperial-charcoal">
              {deal.images[0] ? (
                <Image
                  src={deal.images[0].url}
                  alt={deal.images[0].alt}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 20vw, 90vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <PlaceholderImage hue={40} productType={deal.product_type} className="absolute inset-0" />
              )}
            </div>
            <div className="space-y-1 p-4">
              <p className="truncate text-sm font-medium">{deal.name}</p>
              <div className="flex items-baseline gap-2">
                <Price amountXaf={deal.base_price_xaf} className="text-base font-semibold text-imperial-gold" />
                {deal.compare_at_price_xaf ? (
                  <Price
                    amountXaf={deal.compare_at_price_xaf}
                    className="text-xs text-imperial-ivory/40 line-through"
                  />
                ) : null}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-imperial-ivory/50">
            Sélection en cours de chargement…
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-imperial-black/10 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-imperial-ivory">
            <Truck className="h-5 w-5 text-imperial-gold" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-sm text-imperial-black">Livraison rapide</p>
            <p className="text-xs text-imperial-black/55">France ↔ Cameroun, avec suivi de bout en bout.</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-imperial-ivory">
            <ShieldCheck className="h-5 w-5 text-imperial-gold" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-sm text-imperial-black">Paiement sécurisé</p>
            <p className="text-xs text-imperial-black/55">Mobile Money ou carte, acompte à la commande.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
