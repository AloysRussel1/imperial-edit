"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package, RefreshCw, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { fetchMyProducts } from "@/lib/api";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import type { ProductDetail } from "@/types";

function totalStock(product: ProductDetail): number {
  return product.variants.reduce((sum, variant) => sum + variant.available_quantity, 0);
}

export function VendorDashboard() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state._hasHydrated);

  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAccess = user?.role === "admin" || user?.role === "vendor";

  const load = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const data = await fetchMyProducts();
      setProducts(data);
    } catch {
      setError("Impossible de charger vos produits pour le moment.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      load();
    } else {
      setLoading(false);
    }
  }, [canAccess, load]);

  if (!hydrated) {
    return null;
  }

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-imperial-gold" />
        <h2 className="font-display text-xl text-imperial-black">Accès réservé</h2>
        <p className="text-sm text-imperial-black/60">
          {user
            ? "Votre compte n'a pas les droits vendeur ou administrateur nécessaires pour accéder à cet espace."
            : "Connectez-vous avec un compte vendeur ou administrateur pour accéder à cet espace."}
        </p>
        {!user ? (
          <Button asChild variant="gold">
            <Link href="/login?next=/vendor-dashboard">Se connecter</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-imperial-black/50">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement de vos produits…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="outline" onClick={load} disabled={refreshing}>
          <RefreshCw className={refreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-imperial-black/60">
          {products.length} produit{products.length > 1 ? "s" : ""}
          {user?.role === "admin" ? " — catalogue complet (rôle administrateur)" : " rattaché(s) à votre compte"}
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={refreshing ? "mr-2 h-3.5 w-3.5 animate-spin" : "mr-2 h-3.5 w-3.5"} />
          Actualiser
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-imperial-black/15 py-16 text-center text-imperial-black/50">
          <Package className="h-8 w-8" />
          <p>Aucun produit rattaché à votre compte pour le moment.</p>
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
                {user?.role === "admin" && product.vendorEmail ? (
                  <p className="truncate text-xs text-imperial-black/40">Vendeur : {product.vendorEmail}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="hidden w-full max-w-full overflow-x-auto rounded-xl border border-imperial-black/10 bg-white md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-imperial-black/10 text-xs uppercase tracking-wide text-imperial-black/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Prix</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  {user?.role === "admin" ? <th className="px-4 py-3 font-medium">Vendeur</th> : null}
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
                    {user?.role === "admin" ? (
                      <td className="px-4 py-3 text-imperial-black/60">{product.vendorEmail ?? "—"}</td>
                    ) : null}
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
