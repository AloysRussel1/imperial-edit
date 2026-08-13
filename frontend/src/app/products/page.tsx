import { SectionHeading } from "@/components/common/section-heading";
import { CatalogClient } from "@/components/product/catalog-client";
import { fetchProducts } from "@/lib/api";
import { CATALOG_PRODUCT_TYPES } from "@/lib/constants";
import type { ProductType } from "@/types";

interface ProductsPageProps {
  searchParams: { q?: string; sort?: string; type?: string; featured?: string; sale?: string };
}

function pageTitle(sortNew: boolean, featuredOnly: boolean, saleOnly: boolean): string {
  if (sortNew) return "Nouveautés";
  if (featuredOnly) return "Meilleures ventes";
  if (saleOnly) return "Offres du moment";
  return "Toute la collection";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const products = await fetchProducts();
  const sortNew = searchParams.sort === "new";
  const featuredOnly = searchParams.featured === "true";
  const saleOnly = searchParams.sale === "true";
  const initialType = CATALOG_PRODUCT_TYPES.includes(searchParams.type as ProductType)
    ? (searchParams.type as ProductType)
    : undefined;

  return (
    <main className="container py-14">
      <SectionHeading
        align="left"
        eyebrow="Le Catalogue"
        title={pageTitle(sortNew, featuredOnly, saleOnly)}
        description="Sacs, souliers, prêt-à-porter et parfums — chaque pièce est disponible à la commande avec acompte."
        className="mb-12"
      />
      <CatalogClient
        products={products}
        initialQuery={searchParams.q}
        initialType={initialType}
        sortNew={sortNew}
        featuredOnly={featuredOnly}
        saleOnly={saleOnly}
      />
    </main>
  );
}
