"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { useTranslation } from "@/hooks/use-translation";
import { fetchOrder } from "@/lib/api";
import { ORDER_STATUS_META } from "@/lib/order-status";
import type { ApiOrder } from "@/types";

export function CheckoutSuccessContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const number = searchParams.get("number");

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    fetchOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id && !number) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <p className="text-imperial-black/60">{t("checkoutSuccess.noOrder")}</p>
        <Button asChild variant="gold">
          <Link href="/products">{t("checkoutSuccess.discoverCatalog")}</Link>
        </Button>
      </div>
    );
  }

  const statusMeta = order ? ORDER_STATUS_META[order.status] : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-lg border border-imperial-gold/30 bg-imperial-gold/5 p-8 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-imperial-gold" strokeWidth={1.5} />
      <div>
        <h1 className="font-display text-2xl text-imperial-black">{t("checkoutSuccess.title")}</h1>
        <p className="mt-1 text-sm text-imperial-black/60">{t("checkoutSuccess.subtitle")}</p>
      </div>

      <div className="rounded-lg border border-imperial-black/10 bg-white p-5 text-left text-sm">
        <div className="flex items-center justify-between">
          <span className="text-imperial-black/50">{t("checkoutSuccess.trackingNumber")}</span>
          <span className="font-semibold text-imperial-black">{order?.order_number ?? number}</span>
        </div>

        {loading ? (
          <p className="mt-3 text-imperial-black/45">{t("checkoutSuccess.loadingDetails")}</p>
        ) : order ? (
          <>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-imperial-black/50">{t("checkoutSuccess.status")}</span>
              {statusMeta ? <Badge variant={statusMeta.variant}>{t(statusMeta.labelKey)}</Badge> : null}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-imperial-black/50">{t("checkoutSuccess.delivery")}</span>
              <span className="text-imperial-black">{order.delivery_city}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-imperial-black/10 pt-2">
              <span className="text-imperial-black/50">{t("checkoutSuccess.amountPaid")}</span>
              <Price amountXaf={Number(order.amount_paid_xaf)} className="font-semibold text-imperial-gold" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-imperial-black/50">{t("checkoutSuccess.balanceDue")}</span>
              <Price amountXaf={Number(order.amount_remaining_xaf)} className="text-imperial-black" />
            </div>
          </>
        ) : (
          <p className="mt-3 text-imperial-black/45">{t("checkoutSuccess.unavailable")}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild variant="gold">
          <Link href="/dashboard">{t("checkoutSuccess.trackOrder")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">{t("checkoutSuccess.continueShopping")}</Link>
        </Button>
      </div>
    </div>
  );
}
