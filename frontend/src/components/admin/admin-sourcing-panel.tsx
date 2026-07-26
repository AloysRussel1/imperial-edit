"use client";

import Image from "next/image";
import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { useTranslation } from "@/hooks/use-translation";
import { quoteSourcingRequest, rejectSourcingRequest } from "@/lib/api";
import { ADMIN_SOURCING_STATUS_META } from "@/lib/order-status";
import { buildSourcingWhatsAppMessage, buildWhatsAppUrl } from "@/lib/utils";
import type { ApiSourcingRequest } from "@/types";

/** Bouton "Avertir sur WhatsApp" : silencieusement absent si le client n'a pas de numéro renseigné. */
function WhatsAppNotifyButton({ request }: { request: ApiSourcingRequest }) {
  if (!request.customer_whatsapp) return null;

  function handleClick() {
    const url = buildWhatsAppUrl(request.customer_whatsapp, buildSourcingWhatsAppMessage(request));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#25D366]/40 px-2 py-1 text-xs font-medium text-[#128C7E] transition-colors hover:bg-[#25D366]/10"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      Avertir sur WhatsApp
    </button>
  );
}

interface SourcingRowProps {
  request: ApiSourcingRequest;
  onChanged: () => void;
}

function SourcingRow({ request, onChanged }: SourcingRowProps) {
  const { t } = useTranslation();
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
      await rejectSourcingRequest(request.id, note || t("admin.sourcing.defaultRejectReason"));
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-imperial-black/10 bg-white p-5 transition-shadow hover:shadow-elevated sm:flex-row">
      {request.reference_image ? (
        <Image
          src={request.reference_image}
          alt={request.product_name || t("admin.sourcing.referenceItem")}
          width={112}
          height={112}
          className="h-28 w-28 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <PlaceholderImage hue={30} className="h-28 w-28 shrink-0 rounded-lg" iconClassName="h-6 w-6" />
      )}

      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium text-imperial-black">
              {request.product_name || t("admin.sourcing.referenceItem")}
            </p>
            <p className="text-xs text-imperial-black/45">
              {request.customer_name} · {request.customer_whatsapp || request.customer_email} ·{" "}
              {t(`productTypes.${request.category}`)}
              {request.size_or_shoe ? ` · ${request.size_or_shoe}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={statusMeta.variant}>{t(statusMeta.labelKey)}</Badge>
            <WhatsAppNotifyButton request={request} />
          </div>
        </div>

        <p className="text-sm text-imperial-black/65">{request.description}</p>

        {request.budget_max_xaf ? (
          <p className="text-xs tabular-nums text-imperial-black/45">
            {t("admin.sourcing.budgetIndicated")} : <Price amountXaf={Number(request.budget_max_xaf)} />
          </p>
        ) : null}

        {isResolved ? (
          <p className="text-sm tabular-nums text-imperial-black/70">
            {request.status === "rejected"
              ? `${t("admin.sourcing.notFeasible")} — ${request.admin_notes || t("admin.sourcing.unspecifiedReason")}`
              : request.quoted_price_xaf
                ? (
                  <>
                    {t("admin.sourcing.quoteSent")} :{" "}
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
                placeholder={t("admin.sourcing.pricePlaceholder")}
                value={price}
                disabled={busy}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="min-w-[160px] flex-1">
              <Input
                placeholder={t("admin.sourcing.notePlaceholder")}
                value={note}
                disabled={busy}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button size="sm" variant="gold" disabled={!price || busy} onClick={handleQuote}>
              {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              {t("admin.sourcing.sendQuote")}
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={handleReject}>
              {t("admin.sourcing.decline")}
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
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-2xl text-imperial-black">{t("admin.sourcing.title")}</h2>
        <span className="rounded-full bg-imperial-ivory px-2 py-0.5 text-xs font-medium tabular-nums text-imperial-black/50">
          {requests.length}
        </span>
      </div>
      {requests.length === 0 ? (
        <p className="rounded-xl border border-imperial-black/10 bg-white p-8 text-center text-imperial-black/50">
          {t("admin.sourcing.empty")}
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
