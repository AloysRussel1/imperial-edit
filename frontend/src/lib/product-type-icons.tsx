import { Footprints, Gem, Shirt, ShoppingBag, SprayCan, Watch, type LucideIcon } from "lucide-react";

import type { ProductType } from "@/types";

/** Icône par catégorie — partagée entre PlaceholderImage, le menu "Toutes les
 * catégories" et la sidebar catégories de la page d'accueil, pour une
 * identité visuelle cohérente partout où une catégorie est représentée. */
export const PRODUCT_TYPE_ICONS: Record<ProductType, LucideIcon> = {
  bags: ShoppingBag,
  shoes: Footprints,
  clothing: Shirt,
  perfumes: SprayCan,
  watches: Watch,
};

export const DEFAULT_PRODUCT_ICON: LucideIcon = Gem;
