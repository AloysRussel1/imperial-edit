"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/tracking/order-timeline";
import { fetchOrderTracking } from "@/lib/api";
import type { ApiOrderTracking } from "@/types";

interface TrackingDetailContentProps {
  code: string;
}

export function TrackingDetailContent({ code }: TrackingDetailContentProps) {
  const [order, setOrder] = useState<ApiOrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchOrderTracking(code)
      .then(setOrder)
      .catch((err) => {
        if (err instanceof AxiosError && err.response?.status === 404) {
          setError("Aucune commande ne correspond à ce numéro de suivi. Vérifiez le code saisi.");
        } else {
          setError("Impossible de récupérer le suivi pour le moment. Réessayez dans un instant.");
        }
      })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-imperial-black/50">
        <Loader2 className="h-5 w-5 animate-spin" />
        Recherche du colis…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <SearchX className="mx-auto h-8 w-8 text-red-400" />
        <p className="text-sm text-red-700">{error}</p>
        <Button asChild variant="outline">
          <Link href="/tracking">Réessayer avec un autre code</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <OrderTimeline order={order} />
      <p className="text-center text-xs text-imperial-black/45">
        Une question sur cette commande ? Contactez-nous via WhatsApp en mentionnant le numéro{" "}
        <span className="font-medium text-imperial-black">{order.tracking_number}</span>.
      </p>
    </div>
  );
}
