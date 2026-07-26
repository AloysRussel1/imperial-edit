"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { ProductDetail } from "@/types";

interface ProductCardProps {
  product: ProductDetail;
}

export function ProductCard({ product }: ProductCardProps) {
  const cover = product.images[0];
  // Un lien Cloudinary cassé (asset supprimé hors bande, mauvaise config) ne
  // doit jamais afficher l'icône "image cassée" du navigateur — on bascule
  // sur la même vignette de repli que pour les produits sans photo du tout.
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-imperial-black/10 bg-white transition-shadow hover:shadow-elevated"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-imperial-ivory">
        {cover && !imageFailed ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PlaceholderImage hue={30} productType={product.product_type} className="absolute inset-0" />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.is_on_sale ? <Badge variant="sale">Promotion</Badge> : null}
          {product.is_featured ? <Badge variant="gold">Sélection Impériale</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-wide text-imperial-black/45">
          {PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}
        </p>
        <p className="text-xs text-imperial-black/50">{product.brand}</p>
        <h3 className="font-display text-base leading-snug text-imperial-black">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <Price amountXaf={product.base_price_xaf} className="text-sm font-semibold text-imperial-black" />
          {product.compare_at_price_xaf ? (
            <Price
              amountXaf={product.compare_at_price_xaf}
              className="text-xs text-imperial-black/40 line-through"
            />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
