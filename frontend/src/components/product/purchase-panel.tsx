"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DepositCalculator } from "@/components/product/deposit-calculator";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { DepositPercentage, ProductDetail } from "@/types";

interface PurchasePanelProps {
  product: ProductDetail;
}

export function PurchasePanel({ product }: PurchasePanelProps) {
  const sizes = useMemo(() => Array.from(new Set(product.variants.map((v) => v.size))), [product.variants]);
  const colors = useMemo(() => Array.from(new Set(product.variants.map((v) => v.color))), [product.variants]);

  const firstVariant = product.variants[0];
  const [selectedSize, setSelectedSize] = useState(firstVariant?.size ?? "");
  const [selectedColor, setSelectedColor] = useState(firstVariant?.color ?? "");
  const [quantity, setQuantity] = useState(1);
  const [depositPercentage, setDepositPercentage] = useState<DepositPercentage>(product.default_deposit_percentage);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const selectedVariant =
    product.variants.find((v) => v.size === selectedSize && v.color === selectedColor) ?? firstVariant ?? null;

  const unitPrice = selectedVariant?.price_xaf ?? product.base_price_xaf;
  const totalXaf = unitPrice * quantity;
  const inStock = selectedVariant?.is_in_stock ?? false;

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        brand: product.brand,
        size: selectedVariant.size,
        color: selectedVariant.color,
        imageUrl: product.images[0]?.url ?? "",
        unitPriceXaf: unitPrice,
        depositPercentage,
      },
      quantity
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="space-y-6">
      {sizes.length > 1 || sizes[0] !== "Unique" ? (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest2 text-imperial-black/50">Taille</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  selectedSize === size
                    ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                    : "border-imperial-black/15 text-imperial-black/70 hover:border-imperial-gold"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {colors.length > 1 ? (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest2 text-imperial-black/50">Couleur</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  selectedColor === color
                    ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                    : "border-imperial-black/15 text-imperial-black/70 hover:border-imperial-gold"
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs uppercase tracking-widest2 text-imperial-black/50">Quantité</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-imperial-black/15 hover:border-imperial-gold"
            aria-label="Diminuer la quantité"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-imperial-black/15 hover:border-imperial-gold"
            aria-label="Augmenter la quantité"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className={cn("text-xs", inStock ? "text-imperial-black/50" : "text-red-700")}>
            {selectedVariant
              ? inStock
                ? `${selectedVariant.available_quantity} en stock`
                : "Rupture temporaire"
              : "Sélectionnez une variante"}
          </span>
        </div>
      </div>

      <DepositCalculator
        totalXaf={totalXaf}
        depositPercentage={depositPercentage}
        onChangeDepositPercentage={setDepositPercentage}
      />

      <Button
        size="lg"
        variant="gold"
        className="w-full"
        disabled={!selectedVariant || !inStock}
        onClick={handleAddToCart}
      >
        {justAdded ? (
          <>
            <Check className="mr-2 h-4 w-4" /> Ajouté au panier
          </>
        ) : (
          <>
            <ShoppingBag className="mr-2 h-4 w-4" /> Ajouter au panier
          </>
        )}
      </Button>
    </div>
  );
}
