"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { fetchProducts } from "@/lib/api";
import type { ProductDetail } from "@/types";

const MAX_SUGGESTIONS = 6;

interface SearchAutocompleteProps {
  /** Rappelé après toute navigation déclenchée depuis ce composant (résultat
   * cliqué, "Voir tous les résultats", recherche soumise) — permet au
   * conteneur (bottom sheet) de se refermer. */
  onNavigate?: () => void;
}

/**
 * Pas d'endpoint de recherche côté API (voir CatalogClient, qui filtre déjà
 * tout le catalogue en mémoire côté client) : le catalogue complet est
 * chargé une seule fois à l'ouverture, puis filtré localement à chaque
 * frappe — aucun aller-retour réseau supplémentaire, suggestions instantanées.
 */
export function SearchAutocomplete({ onNavigate }: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductDetail[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !products) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS);
  }, [query, products]);

  function goToResults(q: string) {
    onNavigate?.();
    const params = new URLSearchParams(q ? { q } : {});
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    goToResults(query.trim());
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          autoFocus
          type="search"
          placeholder="Un sac, une paire, une marque…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" variant="gold" aria-label="Rechercher">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {query.trim() && products === null ? (
        <div className="flex items-center justify-center gap-2 py-8 text-imperial-black/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement du catalogue…
        </div>
      ) : suggestions.length > 0 ? (
        <div className="divide-y divide-imperial-black/5 overflow-hidden rounded-lg border border-imperial-black/10">
          {suggestions.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              onClick={() => onNavigate?.()}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-imperial-ivory"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-imperial-ivory">
                {product.images[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt}
                    fill
                    unoptimized
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <PlaceholderImage
                    hue={30}
                    productType={product.product_type}
                    className="absolute inset-0"
                    iconClassName="h-4 w-4"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-imperial-black">{product.name}</p>
                <p className="truncate text-xs text-imperial-black/50">{product.brand}</p>
              </div>
              <Price amountXaf={product.base_price_xaf} className="shrink-0 text-sm font-medium text-imperial-black" />
            </Link>
          ))}
          <button
            type="button"
            onClick={() => goToResults(query.trim())}
            className="block w-full p-3 text-center text-sm text-imperial-gold underline underline-offset-4"
          >
            Voir tous les résultats
          </button>
        </div>
      ) : query.trim() && products ? (
        <p className="py-8 text-center text-sm text-imperial-black/50">Aucun résultat pour « {query} ».</p>
      ) : null}
    </div>
  );
}
