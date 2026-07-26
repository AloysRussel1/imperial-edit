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

  // Temporaire : à retirer une fois la cause des images manquantes en
  // production confirmée/résolue — permet d'inspecter en direct, depuis la
  // console du navigateur sur le site déployé, la structure exacte reçue
  // pour chaque produit (notamment `images`, vide ou non).
  console.log("[DEBUG Product Image]", product.name, product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-imperial-black/10 bg-white transition-shadow hover:shadow-elevated"
    >
      {/* Ratio plus court sur mobile (grille en 1 colonne, carte pleine largeur :
          un ratio 4/5 y produit une image très haute qui ralentit le défilement) ;
          on retrouve le ratio portrait plus luxueux dès sm: (grille en 2+ colonnes,
          cartes plus étroites). */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-imperial-ivory sm:aspect-[4/5]">
        {cover && !imageFailed ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            // Cloudinary sert déjà des URLs optimisées (CDN, format, poids) :
            // laisser l'optimiseur d'images Vercel les retraiter est redondant
            // et ajoute un point de défaillance supplémentaire (validation de
            // domaine, quota du plan gratuit) pour un gain nul.
            unoptimized
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => {
              console.error("Erreur de chargement d'image pour :", cover.url);
              setImageFailed(true);
            }}
          />
        ) : (
          <PlaceholderImage hue={30} productType={product.product_type} className="absolute inset-0" />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.is_on_sale ? <Badge variant="sale">Promotion</Badge> : null}
          {product.is_featured ? <Badge variant="gold">Sélection Impériale</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
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
