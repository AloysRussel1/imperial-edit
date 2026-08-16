"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";

import { ProductGrid } from "@/components/product/product-grid";
import { ProductListItem } from "@/components/product/product-list-item";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, formatXAF } from "@/lib/utils";
import { CATALOG_PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { DepositPercentage, ProductDetail, ProductType } from "@/types";

const DEPOSIT_FILTER_OPTIONS: DepositPercentage[] = [50, 70];

type SortOption = "relevance" | "price-asc" | "price-desc" | "newest" | "name-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Pertinence" },
  { value: "newest", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "name-asc", label: "Nom (A-Z)" },
];

interface CatalogClientProps {
  products: ProductDetail[];
  initialQuery?: string;
  initialType?: ProductType;
  sortNew?: boolean;
  featuredOnly?: boolean;
  saleOnly?: boolean;
}

export function CatalogClient({
  products,
  initialQuery,
  initialType,
  sortNew,
  featuredOnly,
  saleOnly,
}: CatalogClientProps) {
  const [query] = useState(initialQuery ?? "");
  const [types, setTypes] = useState<ProductType[]>(initialType ? [initialType] : []);
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [deposits, setDeposits] = useState<DepositPercentage[]>([]);
  const [sort, setSort] = useState<SortOption>(sortNew ? "newest" : "relevance");
  const [view, setView] = useState<"grid" | "list">("grid");

  const catalogMaxPrice = useMemo(
    () => (products.length ? Math.max(...products.map((p) => p.base_price_xaf)) : 0),
    [products]
  );
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const priceCeiling = maxPrice ?? catalogMaxPrice;

  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    for (const product of products) {
      for (const variant of product.variants) sizes.add(variant.size);
    }
    return Array.from(sizes);
  }, [products]);

  const allBrands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))), [products]);

  const filtered = useMemo(() => {
    let result = products;

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }
    if (types.length > 0) {
      result = result.filter((p) => types.includes(p.product_type));
    }
    if (brands.length > 0) {
      result = result.filter((p) => brands.includes(p.brand));
    }
    if (sizes.length > 0) {
      result = result.filter((p) => p.variants.some((v) => sizes.includes(v.size)));
    }
    if (deposits.length > 0) {
      result = result.filter((p) => deposits.includes(p.default_deposit_percentage));
    }
    if (maxPrice !== null) {
      result = result.filter((p) => p.base_price_xaf <= maxPrice);
    }
    if (featuredOnly) {
      result = result.filter((p) => p.is_featured);
    }
    if (saleOnly) {
      result = result.filter((p) => p.is_on_sale);
    }

    result = [...result];
    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.base_price_xaf - b.base_price_xaf);
        break;
      case "price-desc":
        result.sort((a, b) => b.base_price_xaf - a.base_price_xaf);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        break;
      case "newest":
        result.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        break;
      default:
        break;
    }
    return result;
  }, [products, query, types, brands, sizes, deposits, maxPrice, sort, featuredOnly, saleOnly]);

  function toggleType(type: ProductType) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function toggleBrand(brand: string) {
    setBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  }

  function toggleSize(size: string) {
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  function toggleDeposit(pct: DepositPercentage) {
    setDeposits((prev) => (prev.includes(pct) ? prev.filter((d) => d !== pct) : [...prev, pct]));
  }

  function resetFilters() {
    setTypes([]);
    setBrands([]);
    setSizes([]);
    setDeposits([]);
    setMaxPrice(null);
  }

  const hasActiveFilters =
    types.length > 0 || brands.length > 0 || sizes.length > 0 || deposits.length > 0 || maxPrice !== null;
  const advancedFilterCount = sizes.length + deposits.length + (maxPrice !== null ? 1 : 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-10 lg:grid-cols-[240px_1fr]">
      {/* Catégories/marques : carrousel de chips défilant horizontalement, en
          tête du catalogue — jamais la sidebar complète, qui sur mobile
          repousserait toute la grille sous une pile de filtres avant même
          qu'un seul produit ne soit visible. Les filtres plus fins (taille,
          prix, acompte) restent accessibles via le tiroir "Filtres avancés"
          juste en dessous, sans jamais quitter la page. */}
      <div className="space-y-3 lg:hidden">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {CATALOG_PRODUCT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                types.includes(type)
                  ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                  : "border-imperial-black/15 text-imperial-black/70"
              )}
            >
              {PRODUCT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {allBrands.length > 1 ? (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {allBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  brands.includes(brand)
                    ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                    : "border-imperial-black/15 text-imperial-black/70"
                )}
              >
                {brand}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full border border-imperial-black/15 px-3.5 py-1.5 text-sm text-imperial-black/70"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtres avancés
                {advancedFilterCount > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-imperial-gold px-1 text-[10px] font-semibold text-imperial-black">
                    {advancedFilterCount}
                  </span>
                ) : null}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Filtres avancés</SheetTitle>
              </SheetHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-xs uppercase tracking-widest2 text-imperial-black/50">
                    Tailles &amp; pointures
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm transition-colors",
                          sizes.includes(size)
                            ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                            : "border-imperial-black/15 text-imperial-black/70"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {catalogMaxPrice > 0 ? (
                  <div>
                    <h3 className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest2 text-imperial-black/50">
                      <span>Prix maximum</span>
                      <span className="normal-case tracking-normal text-imperial-black/70">
                        {formatXAF(priceCeiling)}
                      </span>
                    </h3>
                    <input
                      type="range"
                      min={0}
                      max={catalogMaxPrice}
                      step={Math.max(1000, Math.round(catalogMaxPrice / 100))}
                      value={priceCeiling}
                      onChange={(event) => setMaxPrice(Number(event.target.value))}
                      className="w-full accent-imperial-gold"
                      aria-label="Filtrer par prix maximum"
                    />
                  </div>
                ) : null}

                <div>
                  <h3 className="mb-3 text-xs uppercase tracking-widest2 text-imperial-black/50">
                    Option d&apos;acompte
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {DEPOSIT_FILTER_OPTIONS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => toggleDeposit(pct)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm transition-colors",
                          deposits.includes(pct)
                            ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                            : "border-imperial-black/15 text-imperial-black/70"
                        )}
                      >
                        Acompte {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <SheetClose asChild>
                  <button
                    type="button"
                    className="w-full rounded-md bg-imperial-gold py-3 text-sm font-medium text-imperial-black"
                  >
                    Voir {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
                  </button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 text-sm text-imperial-gold underline underline-offset-4"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>

      {/* `lg:sticky` : la sidebar de filtres reste visible pendant le défilement
          de la grille, décalée sous le header sticky (h-16 + h-12 + marge).
          Masquée en dessous de `lg` — remplacée par le carrousel de chips et
          le tiroir "Filtres avancés" ci-dessus. */}
      <aside className="hidden space-y-8 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100vh-9rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
        <div>
          <h3 className="mb-3 text-xs uppercase tracking-widest2 text-imperial-black/50">Catégories</h3>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start lg:gap-1.5">
            {CATALOG_PRODUCT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors lg:w-full lg:rounded-md lg:text-left",
                  types.includes(type)
                    ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                    : "border-imperial-black/15 text-imperial-black/70 hover:border-imperial-gold"
                )}
              >
                {PRODUCT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs uppercase tracking-widest2 text-imperial-black/50">Marque</h3>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start lg:gap-1.5">
            {allBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors lg:w-full lg:rounded-md lg:text-left",
                  brands.includes(brand)
                    ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                    : "border-imperial-black/15 text-imperial-black/70 hover:border-imperial-gold"
                )}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs uppercase tracking-widest2 text-imperial-black/50">
            Tailles &amp; pointures
          </h3>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  sizes.includes(size)
                    ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                    : "border-imperial-black/15 text-imperial-black/70 hover:border-imperial-gold"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {catalogMaxPrice > 0 ? (
          <div>
            <h3 className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest2 text-imperial-black/50">
              <span>Prix maximum</span>
              <span className="normal-case tracking-normal text-imperial-black/70">{formatXAF(priceCeiling)}</span>
            </h3>
            <input
              type="range"
              min={0}
              max={catalogMaxPrice}
              step={Math.max(1000, Math.round(catalogMaxPrice / 100))}
              value={priceCeiling}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="w-full accent-imperial-gold"
              aria-label="Filtrer par prix maximum"
            />
          </div>
        ) : null}

        <div>
          <h3 className="mb-3 text-xs uppercase tracking-widest2 text-imperial-black/50">Option d&apos;acompte</h3>
          <div className="flex flex-wrap gap-2">
            {DEPOSIT_FILTER_OPTIONS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => toggleDeposit(pct)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  deposits.includes(pct)
                    ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                    : "border-imperial-black/15 text-imperial-black/70 hover:border-imperial-gold"
                )}
              >
                Acompte {pct}%
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm text-imperial-gold underline underline-offset-4"
          >
            Réinitialiser les filtres
          </button>
        ) : null}
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-imperial-black/50">
            {filtered.length} article{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              aria-label="Trier les produits"
              className="rounded-md border border-imperial-black/15 bg-white px-3 py-1.5 text-sm text-imperial-black/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-imperial-gold"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex items-center rounded-md border border-imperial-black/15">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Vue grille"
                aria-pressed={view === "grid"}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-l-md transition-colors",
                  view === "grid" ? "bg-imperial-black text-imperial-ivory" : "text-imperial-black/50 hover:text-imperial-gold"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="Vue liste"
                aria-pressed={view === "list"}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-r-md transition-colors",
                  view === "list" ? "bg-imperial-black text-imperial-ivory" : "text-imperial-black/50 hover:text-imperial-gold"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {view === "grid" ? (
          <ProductGrid products={filtered} />
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-imperial-black/50">Aucun article ne correspond à cette sélection.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
