"use client";

import { useMemo, useState } from "react";

import { ProductGrid } from "@/components/product/product-grid";
import { cn } from "@/lib/utils";
import { CATALOG_PRODUCT_TYPES, PRICE_BANDS, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { DepositPercentage, ProductDetail, ProductType } from "@/types";

const DEPOSIT_FILTER_OPTIONS: DepositPercentage[] = [50, 70];

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
  const [priceBandIndex, setPriceBandIndex] = useState<number | null>(null);

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
    if (priceBandIndex !== null) {
      const band = PRICE_BANDS[priceBandIndex];
      if (band) {
        result = result.filter((p) => p.base_price_xaf >= band.min && p.base_price_xaf < band.max);
      }
    }
    if (featuredOnly) {
      result = result.filter((p) => p.is_featured);
    }
    if (saleOnly) {
      result = result.filter((p) => p.is_on_sale);
    }
    if (sortNew) {
      result = [...result].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    }
    return result;
  }, [products, query, types, brands, sizes, deposits, priceBandIndex, sortNew, featuredOnly, saleOnly]);

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
    setPriceBandIndex(null);
  }

  const hasActiveFilters =
    types.length > 0 || brands.length > 0 || sizes.length > 0 || deposits.length > 0 || priceBandIndex !== null;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-8">
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

        <div>
          <h3 className="mb-3 text-xs uppercase tracking-widest2 text-imperial-black/50">Tranche de prix</h3>
          <div className="flex flex-col items-start gap-1.5">
            {PRICE_BANDS.map((band, index) => (
              <button
                key={band.label}
                type="button"
                onClick={() => setPriceBandIndex(priceBandIndex === index ? null : index)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-left text-sm transition-colors",
                  priceBandIndex === index
                    ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                    : "border-imperial-black/15 text-imperial-black/70 hover:border-imperial-gold"
                )}
              >
                {band.label}
              </button>
            ))}
          </div>
        </div>

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
        <p className="mb-6 text-sm text-imperial-black/50">
          {filtered.length} article{filtered.length > 1 ? "s" : ""}
        </p>
        <ProductGrid products={filtered} />
      </div>
    </div>
  );
}
