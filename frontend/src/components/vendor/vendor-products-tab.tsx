"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Price } from "@/components/common/price";
import { VendorProductForm } from "@/components/vendor/vendor-product-form";
import { deleteVendorProduct, fetchVendorProducts } from "@/lib/api";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { toast } from "@/store/toast-store";
import type { ProductDetail } from "@/types";

function totalStock(product: ProductDetail): number {
  return product.variants.reduce((sum, v) => sum + v.available_quantity, 0);
}

export function VendorProductsTab() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductDetail | null | "new">(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProducts(await fetchVendorProducts());
    } catch {
      setError("Impossible de charger vos produits pour le moment.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(product: ProductDetail) {
    if (!window.confirm(`Supprimer « ${product.name} » ? Le produit sera retiré de la boutique.`)) {
      return;
    }
    setBusySlug(product.slug);
    try {
      // Le backend désactive plutôt que de supprimer réellement (voir
      // VendorProductViewSet.perform_destroy) — on recharge pour refléter le
      // nouvel état, jamais un retrait local optimiste qui masquerait un échec.
      // Réactivation possible depuis le formulaire d'édition ("Visible sur la boutique").
      await deleteVendorProduct(product.slug);
      await load();
      toast.success("Produit supprimé de la boutique.");
    } catch {
      toast.error("Échec de la suppression du produit.");
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-imperial-black">Mes produits</h2>
        <Button variant="gold" size="sm" onClick={() => setEditing("new")}>
          <Plus className="mr-1.5 h-4 w-4" /> Ajouter un produit
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>
            Réessayer
          </Button>
        </div>
      ) : products === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-imperial-black/50">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-imperial-black/15 py-16 text-center text-imperial-black/50">
          Aucun produit pour le moment — ajoutez votre première pièce.
        </div>
      ) : (
        <div className="w-full max-w-full overflow-x-auto rounded-xl border border-imperial-black/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-imperial-black/10 text-xs uppercase tracking-wide text-imperial-black/45">
              <tr>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-imperial-black/5">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-md bg-imperial-ivory">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </td>
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
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(product)} title="Éditer">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busySlug === product.slug}
                        onClick={() => handleDelete(product)}
                        title="Supprimer"
                        className="hover:border-red-700 hover:text-red-700"
                      >
                        {busySlug === product.slug ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Nouveau produit" : "Modifier le produit"}</DialogTitle>
          </DialogHeader>
          <VendorProductForm
            product={editing === "new" ? null : editing}
            onSaved={() => {
              toast.success(editing === "new" ? "Produit créé avec succès." : "Produit mis à jour avec succès.");
              setEditing(null);
              load();
            }}
            onCancel={() => setEditing(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
