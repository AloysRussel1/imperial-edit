import { ProductCard } from "@/components/product/product-card";
import type { ProductDetail } from "@/types";

interface ProductGridProps {
  products: ProductDetail[];
  emptyMessage?: string;
}

export function ProductGrid({ products, emptyMessage = "Aucun article ne correspond à cette sélection." }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-imperial-black/50">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
