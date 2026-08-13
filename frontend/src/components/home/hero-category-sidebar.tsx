import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { CATALOG_PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { PRODUCT_TYPE_ICONS } from "@/lib/product-type-icons";

/** Colonne de gauche du Hero (desktop uniquement — voir hero-section.tsx) :
 * accès direct aux grandes catégories du catalogue. */
export function HeroCategorySidebar() {
  return (
    <nav
      aria-label="Catégories principales"
      className="hidden h-full flex-col divide-y divide-imperial-black/8 rounded-2xl border border-imperial-black/10 bg-white lg:flex"
    >
      {CATALOG_PRODUCT_TYPES.map((type) => {
        const Icon = PRODUCT_TYPE_ICONS[type];
        return (
          <Link
            key={type}
            href={`/products?type=${type}`}
            className="group flex items-center justify-between gap-2 px-4 py-3.5 text-sm text-imperial-black/75 transition-colors hover:bg-imperial-ivory hover:text-imperial-black"
          >
            <span className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 text-imperial-gold" strokeWidth={1.5} />
              {PRODUCT_TYPE_LABELS[type]}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-imperial-black/25 transition-transform group-hover:translate-x-0.5 group-hover:text-imperial-gold" />
          </Link>
        );
      })}
    </nav>
  );
}
