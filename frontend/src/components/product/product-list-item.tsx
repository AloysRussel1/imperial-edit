"use client";

import { type MouseEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favorites-store";
import type { ProductDetail } from "@/types";

interface ProductListItemProps {
  product: ProductDetail;
}

/** Vue liste alternative à ProductGrid — même comportement (favoris, badges,
 * repli image) que ProductCard, disposée horizontalement pour une lecture
 * dense sur desktop. */
export function ProductListItem({ product }: ProductListItemProps) {
  const cover = product.images[0];
  const [imageFailed, setImageFailed] = useState(false);
  const isFavorite = useFavoritesStore((state) => state.items.some((i) => i.productId === product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  function handleToggleFavorite(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      imageUrl: cover?.url ?? "",
      basePriceXaf: product.base_price_xaf,
    });
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex items-center gap-4 rounded-lg border border-imperial-black/10 bg-white p-3 transition-shadow hover:shadow-elevated sm:gap-6 sm:p-4"
    >
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-imperial-ivory sm:h-28 sm:w-24">
        {cover && !imageFailed ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            unoptimized
            sizes="96px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PlaceholderImage hue={30} productType={product.product_type} className="absolute inset-0" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {product.is_on_sale ? <Badge variant="sale">Promotion</Badge> : null}
          {product.is_featured ? <Badge variant="gold">Sélection Impériale</Badge> : null}
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-imperial-black/45">
          {PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}
        </p>
        <h3 className="truncate font-display text-base text-imperial-black sm:text-lg">{product.name}</h3>
        <p className="text-xs text-imperial-black/50">{product.brand}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={isFavorite}
          className="text-imperial-black/40 transition-colors hover:text-imperial-gold"
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-imperial-gold text-imperial-gold")} strokeWidth={1.75} />
        </button>
        <div className="text-right">
          <Price amountXaf={product.base_price_xaf} className="text-sm font-semibold text-imperial-black" />
          {product.compare_at_price_xaf ? (
            <Price
              amountXaf={product.compare_at_price_xaf}
              className="block text-xs text-imperial-black/40 line-through"
            />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
