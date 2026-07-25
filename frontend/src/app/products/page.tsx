import { SectionHeading } from "@/components/common/section-heading";
import { CatalogClient } from "@/components/product/catalog-client";
import { fetchProducts } from "@/lib/api";

interface ProductsPageProps {
  searchParams: { q?: string; sort?: string };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const products = await fetchProducts();
  const sortNew = searchParams.sort === "new";

  return (
    <main className="container py-14">
      <SectionHeading
        align="left"
        eyebrow="Le Catalogue"
        title={sortNew ? "Nouveautés" : "Toute la collection"}
        description="Sacs, souliers, prêt-à-porter et parfums — chaque pièce est disponible à la commande avec acompte."
        className="mb-12"
      />
      <CatalogClient products={products} initialQuery={searchParams.q} sortNew={sortNew} />
    </main>
  );
}
