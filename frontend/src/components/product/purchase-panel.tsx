"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DepositCalculator } from "@/components/product/deposit-calculator";
import { colorToSwatch } from "@/lib/color-swatches";
import { cn } from "@/lib/utils";
import { VARIANT_AXIS_BY_TYPE } from "@/lib/variant-labels";
import { Price } from "@/components/common/price";
import { useCartStore } from "@/store/cart-store";
import type { DepositPercentage, ProductDetail } from "@/types";

interface PurchasePanelProps {
  product: ProductDetail;
}

export function PurchasePanel({ product }: PurchasePanelProps) {
  const router = useRouter();
  const axis = VARIANT_AXIS_BY_TYPE[product.product_type];
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

  function addToCart() {
    if (!selectedVariant) return false;
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
    return true;
  }

  function handleAddToCart() {
    if (!addToCart()) return;
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!addToCart()) return;
    router.push("/checkout");
  }

  return (
    <div className="space-y-6">
      {sizes.length > 1 || sizes[0] !== "Unique" ? (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest2 text-imperial-black/50">{axis.primaryLabel}</p>
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
          <p className="mb-2 text-xs uppercase tracking-widest2 text-imperial-black/50">
            {axis.secondaryLabel} — <span className="normal-case text-imperial-black/60">{selectedColor}</span>
          </p>
          {axis.secondaryIsColor ? (
            <div className="flex flex-wrap gap-2.5">
              {colors.map((color) => {
                const swatch = colorToSwatch(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    aria-label={color}
                    aria-pressed={selectedColor === color}
                    title={color}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                      selectedColor === color ? "border-imperial-gold" : "border-transparent hover:border-imperial-black/20"
                    )}
                  >
                    <span
                      className="h-6 w-6 rounded-full border border-imperial-black/10"
                      style={swatch ? { background: swatch } : undefined}
                    >
                      {!swatch ? <span className="sr-only">{color}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-pressed={selectedColor === color}
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
          )}
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

      {/* En dessous de lg, ces boutons sont remplacés par la barre fixe en
          bas d'écran ci-dessous — toujours visible sans avoir à re-scroller
          jusqu'ici, y compris après avoir lu la description ou les avis. */}
      <div className="hidden gap-3 lg:flex">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
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
        <Button size="lg" variant="gold" className="flex-1" disabled={!selectedVariant || !inStock} onClick={handleBuyNow}>
          <Zap className="mr-2 h-4 w-4" /> Acheter maintenant
        </Button>
      </div>

      {/* Barre d'action fixe mobile/tablette : le prix + les deux CTA restent
          accessibles en permanence, quelle que soit la position de défilement
          sur la page produit (description, avis, produits similaires…). */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-imperial-black/10 bg-white/95 p-3 backdrop-blur [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="min-w-0 shrink-0">
          <p className="text-[0.65rem] uppercase tracking-wide text-imperial-black/45">Acompte</p>
          <Price amountXaf={Math.round((totalXaf * depositPercentage) / 100)} className="font-semibold text-imperial-black" />
        </div>
        <Button
          size="lg"
          variant="outline"
          className="shrink-0 px-3"
          disabled={!selectedVariant || !inStock}
          onClick={handleAddToCart}
          aria-label="Ajouter au panier"
        >
          {justAdded ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
        </Button>
        <Button
          size="lg"
          variant="gold"
          className="flex-1"
          disabled={!selectedVariant || !inStock}
          onClick={handleBuyNow}
        >
          <Zap className="mr-2 h-4 w-4" /> Acheter maintenant
        </Button>
      </div>
    </div>
  );
}
