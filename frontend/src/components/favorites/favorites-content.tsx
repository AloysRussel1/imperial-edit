"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { useAuthStore } from "@/store/auth-store";
import { useFavoritesStore } from "@/store/favorites-store";

export function FavoritesContent() {
  const hydrated = useAuthStore((state) => state._hasHydrated);
  const items = useFavoritesStore((state) => state.items);
  const toggle = useFavoritesStore((state) => state.toggle);

  if (!hydrated) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <Heart className="mx-auto h-8 w-8 text-imperial-gold" strokeWidth={1.5} />
        <h2 className="font-display text-xl text-imperial-black">Aucun favori pour le moment</h2>
        <p className="text-sm text-imperial-black/60">
          Ajoutez des pièces à vos favoris depuis le catalogue en cliquant sur le cœur d&apos;une carte produit.
        </p>
        <Button asChild variant="gold">
          <Link href="/products">Découvrir le catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.productId}
          className="group relative flex flex-col overflow-hidden rounded-lg border border-imperial-black/10 bg-white transition-shadow hover:shadow-elevated"
        >
          <Link href={`/products/${item.slug}`} className="relative aspect-[4/3] w-full overflow-hidden bg-imperial-ivory sm:aspect-[4/5]">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                unoptimized
                sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => toggle(item)}
            aria-label="Retirer des favoris"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-imperial-black/60 shadow-sm backdrop-blur transition-colors hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <Link href={`/products/${item.slug}`} className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
            <p className="text-xs text-imperial-black/50">{item.brand}</p>
            <h3 className="font-display text-base leading-snug text-imperial-black">{item.name}</h3>
            <Price amountXaf={item.basePriceXaf} className="mt-auto pt-2 text-sm font-semibold text-imperial-black" />
          </Link>
        </div>
      ))}
    </div>
  );
}
