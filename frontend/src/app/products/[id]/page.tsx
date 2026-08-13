import { notFound } from "next/navigation";
import { MapPin, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Price } from "@/components/common/price";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductReassurance } from "@/components/product/product-reassurance";
import { ProductTabs } from "@/components/product/product-tabs";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { RelatedProducts } from "@/components/product/related-products";
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

  const discountPct = product.compare_at_price_xaf
    ? Math.round((1 - product.base_price_xaf / product.compare_at_price_xaf) * 100)
    : null;

  return (
    <main className="container py-12">
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Catalogue", href: "/products" },
          { label: PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type, href: `/products?type=${product.product_type}` },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <ProductGallery images={product.images} />

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {product.is_on_sale ? <Badge variant="sale">Promotion</Badge> : null}
            {discountPct ? <Badge variant="sale">-{discountPct}%</Badge> : null}
            {product.is_featured ? <Badge variant="gold">Sélection Impériale</Badge> : null}
            <Badge variant={product.availability.status === "in_stock" ? "success" : "outline"}>
              {STOCK_STATUS_LABELS[product.availability.status]}
            </Badge>
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

          <div className="mt-8">
            <PurchasePanel product={product} />
          </div>

          <ProductReassurance deliveryEstimate={product.availability.delivery_estimate} />
        </div>
      </div>

      <ProductTabs product={product} />

      <RelatedProducts currentProductId={product.id} productType={product.product_type} />
    </main>
  );
}
