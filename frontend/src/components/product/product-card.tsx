"use client";

import { type MouseEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { toast } from "@/store/toast-store";
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

  // Souscription directe à `items` (plutôt que la méthode `isFavorite()` du
  // store, non réactive) pour que le cœur se mette à jour immédiatement au clic.
  const isFavorite = useFavoritesStore((state) => state.items.some((i) => i.productId === product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  // Ajout rapide (+/-) directement depuis la carte : ajoute toujours la
  // variante par défaut (première en stock, sinon la première tout court) —
  // jamais de sélecteur taille/couleur ici, qui resterait le rôle de la
  // fiche produit. Le toast de confirmation précise la variante réellement
  // ajoutée pour qu'un client cherchant une autre taille sache tout de suite
  // qu'il doit passer par la fiche produit plutôt que d'être surpris à la
  // livraison.
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const defaultVariant = useMemo(
    () => product.variants.find((v) => v.is_in_stock) ?? product.variants[0] ?? null,
    [product.variants]
  );
  const quantityInCart = useCartStore((state) =>
    defaultVariant ? state.items.find((i) => i.variantId === defaultVariant.id)?.quantity ?? 0 : 0
  );

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

  function handleQuickAdd(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!defaultVariant || !defaultVariant.is_in_stock) return;
    addItem(
      {
        variantId: defaultVariant.id,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        brand: product.brand,
        size: defaultVariant.size,
        color: defaultVariant.color,
        imageUrl: cover?.url ?? "",
        unitPriceXaf: defaultVariant.price_xaf,
        depositPercentage: product.default_deposit_percentage,
      },
      1
    );
    const variantLabel = [defaultVariant.size, defaultVariant.color]
      .filter((v) => v && v !== "Unique")
      .join(" · ");
    toast.success(`${product.name}${variantLabel ? ` (${variantLabel})` : ""} ajouté au panier.`);
  }

  function handleDecrement(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!defaultVariant) return;
    updateQuantity(defaultVariant.id, quantityInCart - 1);
  }

  function handleIncrement(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!defaultVariant) return;
    updateQuantity(defaultVariant.id, quantityInCart + 1);
  }

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
            // Cloudinary sert déjà des URLs optimisées (CDN, format, poids) :
            // laisser l'optimiseur d'images Vercel les retraiter est redondant
            // et ajoute un point de défaillance supplémentaire (validation de
            // domaine, quota du plan gratuit) pour un gain nul.
            unoptimized
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => {
              console.error("Erreur de chargement d'image pour :", cover.url);
              setImageFailed(true);
            }}
          />
        ) : (
          <PlaceholderImage hue={30} productType={product.product_type} className="absolute inset-0" />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {product.is_on_sale ? <Badge variant="sale">Promotion</Badge> : null}
          {product.is_featured ? <Badge variant="gold">Sélection Impériale</Badge> : null}
        </div>
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={isFavorite}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-imperial-black/60 shadow-sm backdrop-blur transition-colors hover:text-imperial-gold sm:right-3 sm:top-3"
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-imperial-gold text-imperial-gold")} strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-4">
        <p className="text-[0.65rem] uppercase tracking-wide text-imperial-black/45 sm:text-xs">
          {PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}
        </p>
        <p className="text-xs text-imperial-black/50">{product.brand}</p>
        <h3 className="font-display text-sm leading-snug text-imperial-black sm:text-base">{product.name}</h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2">
          <Price amountXaf={product.base_price_xaf} className="text-sm font-semibold text-imperial-black" />
          {product.compare_at_price_xaf ? (
            <>
              <Price
                amountXaf={product.compare_at_price_xaf}
                className="text-xs text-imperial-black/40 line-through"
              />
              <Badge variant="sale" className="ml-auto">
                -{Math.round((1 - product.base_price_xaf / product.compare_at_price_xaf) * 100)}%
              </Badge>
            </>
          ) : null}
        </div>

        {defaultVariant ? (
          <div className="mt-2 flex items-center justify-end">
            {quantityInCart === 0 ? (
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={!defaultVariant.is_in_stock}
                aria-label={`Ajouter ${product.name} au panier`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-imperial-black text-imperial-ivory transition-colors hover:bg-imperial-gold hover:text-imperial-black disabled:cursor-not-allowed disabled:bg-imperial-black/20"
              >
                <Plus className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  aria-label="Diminuer la quantité"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-imperial-black/15 hover:border-imperial-gold"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-4 text-center text-sm tabular-nums">{quantityInCart}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  aria-label="Augmenter la quantité"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-imperial-black/15 hover:border-imperial-gold"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
