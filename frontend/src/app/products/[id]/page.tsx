import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/common/price";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { fetchProductBySlug } from "@/lib/api";
import { PRODUCT_TYPE_LABELS, STOCK_STATUS_LABELS } from "@/lib/constants";

interface ProductDetailPageProps {
  params: { id: string };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await fetchProductBySlug(params.id);

  if (!product) {
    notFound();
  }

  return (
    <main className="container py-12">
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-imperial-black/50">
        <Link href="/products" className="hover:text-imperial-gold">
          Catalogue
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-imperial-black">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <ProductGallery images={product.images} />

        <div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {product.is_on_sale ? <Badge variant="sale">Promotion</Badge> : null}
            {product.is_featured ? <Badge variant="gold">Sélection Impériale</Badge> : null}
          </div>
          <p className="text-sm text-imperial-black/50">{product.brand}</p>
          <h1 className="mt-1 font-display text-3xl text-imperial-black md:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <Price amountXaf={product.base_price_xaf} className="text-xl font-semibold text-imperial-black" />
            {product.compare_at_price_xaf ? (
              <Price amountXaf={product.compare_at_price_xaf} className="text-sm text-imperial-black/40 line-through" />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-imperial-black/45">
            ≈ {product.price_eur.toLocaleString("fr-FR")} € (prix de référence Europe)
          </p>

          <div className="mt-4 flex flex-col gap-1.5 rounded-md bg-imperial-ivory p-3 text-xs text-imperial-black/60">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-imperial-gold" />
              <span>
                {STOCK_STATUS_LABELS[product.availability.status]} — {product.availability.location}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-imperial-gold" />
              <span>Livraison estimée : {product.availability.delivery_estimate}</span>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-imperial-black/70">{product.description}</p>

          <div className="mt-8">
            <PurchasePanel product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
