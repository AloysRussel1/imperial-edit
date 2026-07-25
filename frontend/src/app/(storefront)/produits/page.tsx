import { fetchProducts } from "@/lib/api";

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl">Le Catalogue</h1>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="rounded-lg border border-imperial-black/10 p-4">
            <h2 className="font-medium">{product.name}</h2>
            <p className="text-imperial-gold">{product.base_price_xaf.toLocaleString("fr-FR")} XAF</p>
          </article>
        ))}
      </div>
    </main>
  );
}
