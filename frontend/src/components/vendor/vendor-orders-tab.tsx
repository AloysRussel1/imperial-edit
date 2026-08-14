"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { fetchVendorOrderItems, updateVendorOrderItemFulfillment } from "@/lib/api";
import type { ApiVendorOrderItem, FulfillmentStatus } from "@/types";

const NEXT_STATUS: Partial<Record<FulfillmentStatus, FulfillmentStatus>> = {
  pending: "preparing",
  preparing: "shipped",
};

const NEXT_ACTION_LABEL: Partial<Record<FulfillmentStatus, string>> = {
  pending: "Marquer en préparation",
  preparing: "Marquer comme expédié",
};

const STATUS_BADGE_VARIANT: Record<FulfillmentStatus, "outline" | "info" | "success"> = {
  pending: "outline",
  preparing: "info",
  shipped: "success",
};

export function VendorOrdersTab() {
  const [items, setItems] = useState<ApiVendorOrderItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchVendorOrderItems());
    } catch {
      setError("Impossible de charger vos commandes pour le moment.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdvance(item: ApiVendorOrderItem) {
    const next = NEXT_STATUS[item.fulfillment_status];
    if (!next) return;
    setBusyId(item.id);
    try {
      const updated = await updateVendorOrderItemFulfillment(item.id, next);
      setItems((prev) => prev?.map((i) => (i.id === item.id ? updated : i)) ?? null);
    } catch {
      setError("Échec de la mise à jour du statut.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-imperial-black">Commandes à traiter</h2>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>
            Réessayer
          </Button>
        </div>
      ) : items === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-imperial-black/50">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-imperial-black/15 py-16 text-center text-imperial-black/50">
          <PackageSearch className="mx-auto mb-3 h-8 w-8 text-imperial-black/25" />
          Aucune commande à préparer pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-imperial-black/10 bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-imperial-black">{item.order_number}</p>
                  <Badge variant={STATUS_BADGE_VARIANT[item.fulfillment_status]}>
                    {item.fulfillment_status_display}
                  </Badge>
                </div>
                <p className="text-xs text-imperial-black/45">
                  {new Date(item.order_created_at).toLocaleDateString("fr-FR")} · {item.customer_name}
                </p>
                <p className="mt-1 text-sm text-imperial-black">
                  {item.product_name_snapshot} <span className="text-imperial-black/45">× {item.quantity}</span>
                </p>
                <p className="text-xs text-imperial-black/45">SKU {item.sku_snapshot}</p>
              </div>
              <div className="flex items-center gap-4">
                <Price amountXaf={Number(item.line_total_xaf)} className="font-semibold text-imperial-black" />
                {NEXT_STATUS[item.fulfillment_status] ? (
                  <Button
                    size="sm"
                    variant="gold"
                    disabled={busyId === item.id}
                    onClick={() => handleAdvance(item)}
                  >
                    {busyId === item.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    {NEXT_ACTION_LABEL[item.fulfillment_status]}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
