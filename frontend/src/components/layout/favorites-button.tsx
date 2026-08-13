"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useFavoritesStore } from "@/store/favorites-store";

export function FavoritesButton() {
  const count = useFavoritesStore((state) => state.items.length);

  return (
    <Link
      href="/favoris"
      aria-label="Mes favoris"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:text-imperial-gold"
    >
      <Heart className="h-4 w-4" strokeWidth={1.75} />
      {count > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-imperial-gold text-[10px] font-semibold text-imperial-black">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
