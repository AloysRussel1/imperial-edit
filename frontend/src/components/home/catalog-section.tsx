"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { fetchProducts } from "@/lib/api";
import { CATALOG_PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { PRODUCT_TYPE_ICONS } from "@/lib/product-type-icons";
import type { ProductDetail } from "@/types";

/** Récupération côté client (même raisonnement que l'ancienne
 * FeaturedSelection) : la vitrine ne doit jamais dépendre d'un appel
 * bloquant au backend pour s'afficher. */
export function CatalogSection() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((error) => {
        console.error("Impossible de charger le catalogue :", error);
        if (!cancelled) {
          setProducts([]);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSale = products?.filter((p) => p.is_on_sale) ?? [];
  const highlighted = (onSale.length > 0 ? onSale : products?.filter((p) => p.is_featured) ?? []).slice(0, 8);
  const maxDiscount = onSale.reduce((max, p) => {
    if (!p.compare_at_price_xaf) return max;
    const pct = Math.round((1 - p.base_price_xaf / p.compare_at_price_xaf) * 100);
    return Math.max(max, pct);
  }, 0);

  return (
    <section className="bg-imperial-ivory py-20">
      <div className="container grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden space-y-1.5 lg:block">
          <h3 className="mb-3 text-xs uppercase tracking-widest2 text-imperial-black/50">Meilleures catégories</h3>
          {CATALOG_PRODUCT_TYPES.map((type) => {
            const Icon = PRODUCT_TYPE_ICONS[type];
            return (
              <Link
                key={type}
                href={`/products?type=${type}`}
                className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-imperial-black/70 transition-colors hover:bg-white hover:text-imperial-gold"
              >
                <Icon className="h-4 w-4 text-imperial-gold" strokeWidth={1.5} />
                {PRODUCT_TYPE_LABELS[type]}
              </Link>
            );
          })}
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link href="/products">Voir toutes les catégories</Link>
          </Button>
        </aside>

        <div>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl text-imperial-black sm:text-3xl">Offres à ne pas manquer</h2>
              {maxDiscount > 0 ? <Badge variant="sale">Jusqu&apos;à -{maxDiscount}%</Badge> : null}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/products?sale=true">
                Voir toutes les offres
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {products === null ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] w-full animate-pulse rounded-lg bg-imperial-black/5" />
              ))}
            </div>
          ) : failed ? (
            <p className="py-16 text-center text-imperial-black/50">
              Les produits se chargent, veuillez patienter quelques secondes...
            </p>
          ) : (
            <ProductGrid products={highlighted} emptyMessage="Aucune offre en cours pour le moment." />
          )}
        </div>
      </div>
    </section>
  );
}
