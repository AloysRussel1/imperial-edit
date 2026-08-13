"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { cartTotalCount, cartTotalXaf, useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";

export function CartPageContent() {
  const hydrated = useAuthStore((state) => state._hasHydrated);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const count = cartTotalCount(items);
  const total = cartTotalXaf(items);

  if (!hydrated) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <ShoppingBag className="mx-auto h-8 w-8 text-imperial-black/25" />
        <h2 className="font-display text-xl text-imperial-black">Votre panier est vide</h2>
        <p className="text-sm text-imperial-black/60">Découvrez le catalogue pour composer votre sélection.</p>
        <Button asChild variant="gold">
          <Link href="/products">Découvrir le catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-4 rounded-lg border border-imperial-black/10 bg-white p-4">
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-imperial-ivory">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
              ) : (
                <PlaceholderImage hue={30} className="absolute inset-0" iconClassName="h-5 w-5" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-imperial-black">{item.name}</p>
                  <p className="text-xs text-imperial-black/50">
                    {item.brand} · {item.size} · {item.color}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  aria-label="Retirer l'article"
                  className="shrink-0 text-imperial-black/30 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-imperial-black/50">Acompte {item.depositPercentage}% à la commande</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-imperial-black/15 hover:border-imperial-gold"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-imperial-black/15 hover:border-imperial-gold"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Price amountXaf={item.unitPriceXaf} className="text-sm text-imperial-black/50" />
                <Price amountXaf={item.unitPriceXaf * item.quantity} className="text-base font-semibold text-imperial-black" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Récapitulatif toujours visible pendant le défilement de la liste. */}
      <aside className="h-fit space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6 lg:sticky lg:top-32">
        <h2 className="font-display text-lg text-imperial-black">
          Récapitulatif ({count} article{count > 1 ? "s" : ""})
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-imperial-black/60">Sous-total</dt>
            <dd className="text-imperial-black">
              <Price amountXaf={total} />
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-imperial-black/60">Livraison</dt>
            <dd className="text-imperial-black/50">Calculée à la commande</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between border-t border-imperial-black/10 pt-3">
          <p className="font-medium text-imperial-black">Total</p>
          <Price amountXaf={total} className="text-lg font-semibold text-imperial-black" />
        </div>
        <Button asChild variant="gold" size="lg" className="w-full">
          <Link href="/checkout">Passer la commande</Link>
        </Button>
        <p className="text-center text-xs text-imperial-black/45">
          Le détail de l&apos;acompte par article s&apos;affiche sur chaque fiche produit.
        </p>
      </aside>
    </div>
  );
}
