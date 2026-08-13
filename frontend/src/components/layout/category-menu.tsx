"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATALOG_PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { PRODUCT_TYPE_ICONS } from "@/lib/product-type-icons";

/** Bouton d'accès rapide au catalogue, groupé par catégorie — utilisé dans
 * la barre de navigation principale ET réutilisable ailleurs (sidebar Hero). */
export function CategoryMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 whitespace-nowrap rounded-md bg-imperial-black px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-imperial-ivory transition-colors hover:bg-imperial-black/90"
        >
          <LayoutGrid className="h-4 w-4 text-imperial-gold" strokeWidth={1.75} />
          Toutes les catégories
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {CATALOG_PRODUCT_TYPES.map((type) => {
          const Icon = PRODUCT_TYPE_ICONS[type];
          return (
            <DropdownMenuItem key={type} asChild>
              <Link href={`/products?type=${type}`} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-imperial-gold" strokeWidth={1.5} />
                  {PRODUCT_TYPE_LABELS[type]}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-imperial-black/30" />
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
