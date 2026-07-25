"use client";

import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { quoteSourcingRequest, rejectSourcingRequest } from "@/lib/api";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { ADMIN_SOURCING_STATUS_META } from "@/lib/order-status";
import type { ApiSourcingRequest } from "@/types";

interface SourcingRowProps {
  request: ApiSourcingRequest;
  onChanged: () => void;
}

function SourcingRow({ request, onChanged }: SourcingRowProps) {
  const [price, setPrice] = useState(request.quoted_price_xaf ? String(Number(request.quoted_price_xaf)) : "");
  const [note, setNote] = useState(request.admin_notes);
  const [busy, setBusy] = useState(false);

  const statusMeta = ADMIN_SOURCING_STATUS_META[request.status];
  const isResolved = request.status !== "new" && request.status !== "under_review";

  async function handleQuote() {
    setBusy(true);
    try {
      await quoteSourcingRequest(request.id, Number(price), note);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await rejectSourcingRequest(request.id, note || "Article non trouvé chez nos partenaires.");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-imperial-black/10 bg-white p-5 sm:flex-row">
      {request.reference_image ? (
        <Image
          src={request.reference_image}
          alt={request.product_name || "Article recherché"}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 rounded-md object-cover"
        />
      ) : (
        <PlaceholderImage hue={30} className="h-24 w-24 shrink-0 rounded-md" iconClassName="h-6 w-6" />
      )}

      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium text-imperial-black">{request.product_name || "Article recherché"}</p>
            <p className="text-xs text-imperial-black/45">
              {request.customer_name} · {request.customer_whatsapp || request.customer_email} ·{" "}
              {PRODUCT_TYPE_LABELS[request.category] ?? request.category}
              {request.size_or_shoe ? ` · ${request.size_or_shoe}` : ""}
            </p>
          </div>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>

        <p className="text-sm text-imperial-black/65">{request.description}</p>

        {request.budget_max_xaf ? (
          <p className="text-xs text-imperial-black/45">
            Budget indiqué : <Price amountXaf={Number(request.budget_max_xaf)} />
          </p>
        ) : null}

        {isResolved ? (
          <p className="text-sm text-imperial-black/70">
            {request.status === "rejected"
              ? `Non réalisable — ${request.admin_notes || "raison non précisée"}`
              : request.quoted_price_xaf
                ? (
                  <>
                    Devis envoyé :{" "}
                    <Price amountXaf={Number(request.quoted_price_xaf)} className="font-semibold text-imperial-gold" />
                    {request.admin_notes ? <span className="text-imperial-black/50"> — {request.admin_notes}</span> : null}
                  </>
                )
                : null}
          </p>
        ) : (
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
            <div className="min-w-[160px] flex-1">
              <Input
                placeholder="Note (délai, disponibilité…)"
                value={note}
                disabled={busy}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button size="sm" variant="gold" disabled={!price || busy} onClick={handleQuote}>
              {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Envoyer le devis
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={handleReject}>
              Décliner
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminSourcingPanelProps {
  requests: ApiSourcingRequest[];
  onChanged: () => void;
}

export function AdminSourcingPanel({ requests, onChanged }: AdminSourcingPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-imperial-black">Demandes de sourcing</h2>
      {requests.length === 0 ? (
        <p className="rounded-lg border border-imperial-black/10 bg-white p-8 text-center text-imperial-black/50">
          Aucune demande de sourcing pour le moment.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <SourcingRow key={request.id} request={request} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}
