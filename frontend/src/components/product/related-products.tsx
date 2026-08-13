"use client";

import { useEffect, useState } from "react";

import { ProductGrid } from "@/components/product/product-grid";
import { fetchProducts } from "@/lib/api";
import type { ProductDetail, ProductType } from "@/types";

interface RelatedProductsProps {
  currentProductId: string;
  productType: ProductType;
}

/** Vente croisée : autres pièces de la même catégorie, chargées côté client
 * (même raisonnement de résilience que le reste de la vitrine). */
export function RelatedProducts({ currentProductId, productType }: RelatedProductsProps) {
  const [related, setRelated] = useState<ProductDetail[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((products) => {
        if (cancelled) return;
        setRelated(products.filter((p) => p.product_type === productType && p.id !== currentProductId).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currentProductId, productType]);

  if (related !== null && related.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-imperial-black/10 pt-12">
      <h2 className="mb-8 font-display text-2xl text-imperial-black">Produits similaires</h2>
      {related === null ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-[3/4] w-full animate-pulse rounded-lg bg-imperial-black/5" />
          ))}
        </div>
      ) : (
        <ProductGrid products={related} />
      )}
    </section>
  );
}
