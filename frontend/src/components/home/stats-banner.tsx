"use client";

import { useEffect, useState } from "react";
import { Layers, MapPinned, ShoppingBag, Sparkles } from "lucide-react";

import { fetchProducts } from "@/lib/api";
import { CATALOG_PRODUCT_TYPES } from "@/lib/constants";

interface Stat {
  icon: typeof ShoppingBag;
  value: string;
  label: string;
}

/** Chiffres réels (pas de statistique fabriquée) : dérivés du catalogue
 * effectivement en base au chargement de la page — nombre de pièces actives,
 * de catégories et de marques distinctes. */
export function StatsBanner() {
  const [stats, setStats] = useState<Stat[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((products) => {
        if (cancelled) return;
        const brandCount = new Set(products.map((p) => p.brand)).size;
        setStats([
          { icon: ShoppingBag, value: `${products.length}+`, label: "Pièces au catalogue" },
          { icon: Layers, value: `${CATALOG_PRODUCT_TYPES.length}`, label: "Catégories" },
          { icon: Sparkles, value: `${brandCount}+`, label: "Maisons partenaires" },
          { icon: MapPinned, value: "France ↔ Cameroun", label: "Sourcing & livraison" },
        ]);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  return (
    <section className="bg-imperial-black py-12 text-imperial-ivory">
      <div className="container grid grid-cols-2 gap-8 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
            <stat.icon className="h-6 w-6 text-imperial-gold" strokeWidth={1.5} />
            <p className="font-display text-2xl sm:text-3xl">{stat.value}</p>
            <p className="text-xs uppercase tracking-wide text-imperial-ivory/55">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
