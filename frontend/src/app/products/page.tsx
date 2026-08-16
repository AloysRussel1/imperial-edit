import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { SectionHeading } from "@/components/common/section-heading";
import { CatalogClient } from "@/components/product/catalog-client";
import { fetchProducts } from "@/lib/api";
import { CATALOG_PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { ProductType } from "@/types";

interface ProductsPageProps {
  searchParams: { q?: string; sort?: string; type?: string; featured?: string; sale?: string };
}

function pageTitle(sortNew: boolean, featuredOnly: boolean, saleOnly: boolean, typeLabel: string | null): string {
  if (typeLabel) return typeLabel;
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
  const typeLabel = initialType ? PRODUCT_TYPE_LABELS[initialType] ?? null : null;
  const title = pageTitle(sortNew, featuredOnly, saleOnly, typeLabel);

  return (
    <main className="container py-8 sm:py-14">
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Catalogue", href: "/products" },
          ...(title !== "Toute la collection" ? [{ label: title }] : []),
        ]}
      />
      <SectionHeading
        align="left"
        eyebrow="Le Catalogue"
        title={title}
        description="Sacs, souliers, prêt-à-porter et parfums — chaque pièce est disponible à la commande avec acompte."
        className="mb-8 sm:mb-12"
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
