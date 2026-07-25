import { Footprints, Gem, Shirt, ShoppingBag, SprayCan, Watch } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProductType } from "@/types";

const ICONS: Record<ProductType, typeof ShoppingBag> = {
  bags: ShoppingBag,
  shoes: Footprints,
  clothing: Shirt,
  perfumes: SprayCan,
  watches: Watch,
};

interface PlaceholderImageProps {
  hue: number;
  productType?: ProductType;
  className?: string;
  iconClassName?: string;
}

/**
 * Vignette dégradée tenant lieu de photographie produit tant que la
 * bibliothèque d'images réelle n'est pas alimentée depuis le back-office.
 */
export function PlaceholderImage({ hue, productType, className, iconClassName }: PlaceholderImageProps) {
  const Icon = productType ? ICONS[productType] : Gem;
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{
        backgroundImage: `linear-gradient(150deg, hsl(${hue} 35% 22%) 0%, hsl(${hue} 25% 10%) 55%, hsl(${(hue + 30) % 360} 40% 8%) 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(228,200,122,0.25), transparent 45%)",
        }}
      />
      <Icon className={cn("relative h-10 w-10 text-imperial-gold/80", iconClassName)} strokeWidth={1.25} />
    </div>
  );
}
