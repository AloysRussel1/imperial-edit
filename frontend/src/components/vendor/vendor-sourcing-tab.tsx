"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { fetchAllSourcingRequests, quoteSourcingRequest } from "@/lib/api";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { toast } from "@/store/toast-store";
import type { ApiSourcingRequest } from "@/types";

interface SourcingRowProps {
  request: ApiSourcingRequest;
  onQuoted: () => void;
}

function VendorSourcingRow({ request, onQuoted }: SourcingRowProps) {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSendQuote() {
    setBusy(true);
    try {
      await quoteSourcingRequest(request.id, Number(price), note);
      toast.success("Devis envoyé au client.");
      onQuoted();
    } catch {
      toast.error("Échec de l'envoi du devis.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-imperial-black/10 bg-white p-5 sm:flex-row">
      {request.reference_image ? (
        <Image
          src={request.reference_image}
          alt={request.product_name || "Article recherché"}
          width={112}
          height={112}
          className="h-28 w-28 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <PlaceholderImage hue={30} className="h-28 w-28 shrink-0 rounded-lg" iconClassName="h-6 w-6" />
      )}

      <div className="flex-1 space-y-2">
        <div>
          <p className="font-medium text-imperial-black">{request.product_name || "Article recherché"}</p>
          <p className="text-xs text-imperial-black/45">
            {request.customer_name} · {PRODUCT_TYPE_LABELS[request.category] ?? request.category}
            {request.size_or_shoe ? ` · ${request.size_or_shoe}` : ""}
          </p>
        </div>

        {request.description ? <p className="text-sm text-imperial-black/65">{request.description}</p> : null}

        {request.budget_max_xaf ? (
          <p className="text-xs tabular-nums text-imperial-black/45">
            Budget indiqué : <Price amountXaf={Number(request.budget_max_xaf)} />
          </p>
        ) : null}

        <div className="flex flex-wrap items-end gap-2 pt-1">
          <div className="w-36">
            <Input
              type="number"
              min={0}
              placeholder="Prix (XAF)"
              value={price}
              disabled={busy}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Note (délai, disponibilité…)"
              value={note}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button size="sm" variant="gold" disabled={!price || busy} onClick={handleSendQuote}>
            {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            Envoyer le devis
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VendorSourcingTab() {
  const [requests, setRequests] = useState<ApiSourcingRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Le backend ne renvoie ici que les demandes encore ouvertes (statut
      // "new"/"under_review") pour un compte vendeur — voir
      // SourcingRequestViewSet.get_queryset côté API.
      setRequests(await fetchAllSourcingRequests());
    } catch {
      setError("Impossible de charger les demandes de sourcing pour le moment.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl text-imperial-black">Demandes de sourcing</h2>
        {requests ? (
          <span className="rounded-full bg-imperial-ivory px-2 py-0.5 text-xs font-medium tabular-nums text-imperial-black/50">
            {requests.length}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>
            Réessayer
          </Button>
        </div>
      ) : requests === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-imperial-black/50">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-imperial-black/15 py-16 text-center text-imperial-black/50">
          <Search className="mx-auto mb-3 h-8 w-8 text-imperial-black/25" />
          Aucune demande de sourcing ouverte pour le moment.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <VendorSourcingRow key={request.id} request={request} onQuoted={load} />
          ))}
        </div>
      )}
    </div>
  );
}
