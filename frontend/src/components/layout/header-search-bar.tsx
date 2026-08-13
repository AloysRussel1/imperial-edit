"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CATALOG_PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { ProductType } from "@/types";

/** Barre de recherche centrale du header (desktop) : sélection rapide de
 * catégorie + saisie libre, envoie directement vers le catalogue filtré.
 * Sur mobile, la recherche reste accessible via SearchDialog (icône) dans
 * le header — pas assez de place pour cette barre complète en dessous de md. */
export function HeaderSearchBar() {
  const router = useRouter();
  const [type, setType] = useState<ProductType | "all">("all");
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type !== "all") params.set("type", type);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="hidden w-full max-w-2xl items-stretch lg:flex">
      <select
        value={type}
        onChange={(event) => setType(event.target.value as ProductType | "all")}
        aria-label="Filtrer par catégorie"
        className="shrink-0 rounded-l-md border border-r-0 border-imperial-black/15 bg-imperial-ivory px-3 text-sm text-imperial-black/70 focus:outline-none focus-visible:ring-1 focus-visible:ring-imperial-gold"
      >
        <option value="all">Toutes catégories</option>
        {CATALOG_PRODUCT_TYPES.map((t) => (
          <option key={t} value={t}>
            {PRODUCT_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher un sac, une marque, une catégorie…"
        className="min-w-0 flex-1 border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black placeholder:text-imperial-black/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-imperial-gold"
      />
      <Button type="submit" variant="gold" className="shrink-0 rounded-l-none">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
