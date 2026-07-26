import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/common/price";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { ProductDetail } from "@/types";

function totalStock(product: ProductDetail): number {
  return product.variants.reduce((sum, variant) => sum + variant.available_quantity, 0);
}

interface AdminCatalogPanelProps {
  products: ProductDetail[];
}

/**
 * Un seul opérateur gère toute la plateforme : ce panneau fait partie du
 * tableau de bord de synthèse unique (voir AdminDashboard), pas d'un espace
 * "vendeur" séparé. Catalogue complet (actif + inactif), même source que
 * les autres sections du dashboard (fetchProducts, déjà non filtré pour un
 * admin authentifié — voir ProductViewSet.get_queryset).
 */
export function AdminCatalogPanel({ products }: AdminCatalogPanelProps) {
  return (
    <div className="w-full max-w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-imperial-black">Catalogue produits</h2>
        <p className="text-sm text-imperial-black/60">
          {products.length} produit{products.length > 1 ? "s" : ""} au total
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-imperial-black/15 py-16 text-center text-imperial-black/50">
          Aucun produit dans le catalogue pour le moment.
        </div>
      ) : (
        <>
          {/* Cartes empilées : lisibles sans défilement horizontal sur mobile/tablette. */}
          <div className="space-y-3 md:hidden">
            {products.map((product) => (
              <div key={product.id} className="space-y-2 rounded-xl border border-imperial-black/10 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-imperial-black">{product.name}</p>
                  <Badge variant={product.is_active ? "success" : "outline"}>
                    {product.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <p className="text-xs uppercase tracking-wide text-imperial-black/45">
                  {PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}
                </p>
                <div className="flex items-center justify-between text-sm tabular-nums text-imperial-black/70">
                  <Price amountXaf={product.base_price_xaf} className="font-semibold text-imperial-black" />
                  <span>Stock : {totalStock(product)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden w-full max-w-full overflow-x-auto rounded-xl border border-imperial-black/10 bg-white md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-imperial-black/10 text-xs uppercase tracking-wide text-imperial-black/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Prix</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-imperial-black/5">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-medium text-imperial-black">{product.name}</td>
                    <td className="px-4 py-3 text-imperial-black/70">
                      {PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <Price amountXaf={product.base_price_xaf} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{totalStock(product)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.is_active ? "success" : "outline"}>
                        {product.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
