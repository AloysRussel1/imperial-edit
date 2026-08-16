"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Price } from "@/components/common/price";
import { cartTotalCount, cartTotalXaf, useCartStore } from "@/store/cart-store";

export function CartSheet() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const count = cartTotalCount(items);
  const total = cartTotalXaf(items);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Voir le panier"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:text-imperial-gold"
        >
          <ShoppingBag className="h-4 w-4" />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-imperial-gold px-1 text-[10px] font-semibold text-imperial-black">
              {count}
            </span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Votre panier ({count})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-imperial-black/60">
            <ShoppingBag className="h-8 w-8 text-imperial-black/30" />
            <p>Votre panier est vide.</p>
            <SheetClose asChild>
              <Link href="/products" className="text-sm text-imperial-gold underline underline-offset-4">
                Découvrir le catalogue
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 border-b border-imperial-black/10 pb-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-imperial-ivory">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    <p className="text-xs text-imperial-black/50">
                      {item.brand} · {item.size} · {item.color}
                    </p>
                    <p className="text-xs text-imperial-black/50">
                      Acompte {item.depositPercentage}% à la commande
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-imperial-black/15 hover:border-imperial-gold"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-imperial-black/15 hover:border-imperial-gold"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Price amountXaf={item.unitPriceXaf * item.quantity} className="text-sm font-medium" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    aria-label="Retirer l'article"
                    className="-m-1.5 h-fit p-1.5 text-imperial-black/30 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-imperial-black/10 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-imperial-black/60">Total (acomptes inclus)</span>
                <Price amountXaf={total} className="text-base font-semibold" />
              </div>
              <SheetClose asChild>
                <Link
                  href="/checkout"
                  className={cn(buttonVariants({ variant: "gold", size: "lg" }), "w-full")}
                >
                  Passer commande
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/cart"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
                >
                  Voir le panier
                </Link>
              </SheetClose>
              <p className="text-center text-xs text-imperial-black/45">
                Le détail de l&apos;acompte par article s&apos;affiche sur chaque fiche produit.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
