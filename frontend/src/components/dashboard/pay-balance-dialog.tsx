"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { CreditCard, Loader2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Price } from "@/components/common/price";
import { fetchOrder, initiatePayment, simulateSandboxPaymentOutcome } from "@/lib/api";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn, formatCameroonPhoneInput } from "@/lib/utils";
import type { ApiOrder, ApiTransaction } from "@/types";

interface PayBalanceDialogProps {
  order: ApiOrder;
  /** Rappelé après un règlement confirmé, pour que le parent recharge la liste depuis l'API. */
  onSettled: () => void;
}

/** Règlement du solde en ligne : jamais "espèces" ici, qui n'a de sens qu'au
 * comptoir (module Caisse) — voir VendorPosTab. */
type OnlinePaymentMethod = "mtn_momo" | "orange_money" | "card";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PayBalanceDialog({ order, onSettled }: PayBalanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<OnlinePaymentMethod>("mtn_momo");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [transaction, setTransaction] = useState<ApiTransaction | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Number(order.amount_remaining_xaf);
  const valid = method === "card" || phone.trim().length > 0;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTransaction(null);
      setConfirmed(false);
      setPhone("");
      setError(null);
    }
  }

  async function handleInitiate() {
    setSubmitting(true);
    setError(null);
    try {
      const txn = await initiatePayment({
        order_id: order.id,
        provider: "cinetpay",
        purpose: "balance",
        payment_method: method,
        payer_phone_number: method === "card" ? undefined : phone,
      });
      setTransaction(txn);
      if (txn.provider !== "sandbox" && txn.payment_url) {
        window.location.href = txn.payment_url;
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Impossible d'initier le paiement pour le moment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulateOutcome(outcome: "success" | "failed") {
    if (!transaction) return;
    setConfirming(true);
    setError(null);
    try {
      await simulateSandboxPaymentOutcome(transaction.provider_reference, outcome);

      let latestOrder = order;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await wait(500);
        latestOrder = await fetchOrder(order.id);
        if (Number(latestOrder.amount_remaining_xaf) <= 0) break;
      }

      if (outcome === "failed" || Number(latestOrder.amount_remaining_xaf) > 0) {
        setError(
          outcome === "failed"
            ? "Paiement refusé (simulation). Vous pouvez réessayer."
            : "La confirmation prend plus de temps que prévu — vérifiez à nouveau dans quelques instants."
        );
        return;
      }

      setConfirmed(true);
      onSettled();
    } catch {
      setError("Impossible de vérifier le paiement pour le moment.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button size="sm" variant="gold">
          Payer le solde
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        {confirmed ? (
          <div className="space-y-3 py-4 text-center">
            <p className="font-display text-lg text-imperial-black">Paiement confirmé</p>
            <p className="text-sm text-imperial-black/60">
              Le solde de la commande {order.order_number} a été réglé. Votre article est prêt pour la
              livraison.
            </p>
            <Button variant="gold" onClick={() => handleOpenChange(false)}>
              Fermer
            </Button>
          </div>
        ) : transaction ? (
          <div className="space-y-4 py-2 text-center">
            <SheetHeader>
              <SheetTitle>Validez le paiement sur votre téléphone</SheetTitle>
              <SheetDescription>
                {method === "card"
                  ? "Une demande de paiement par carte a été initiée."
                  : `Une demande de paiement ${PAYMENT_METHOD_LABELS[method]} a été envoyée au ${phone}.`}{" "}
                Composez votre code pour confirmer.
              </SheetDescription>
            </SheetHeader>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="gold" disabled={confirming} onClick={() => handleSimulateOutcome("success")}>
                {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                J&apos;ai validé sur mon téléphone
              </Button>
              <Button variant="outline" disabled={confirming} onClick={() => handleSimulateOutcome("failed")}>
                Simuler un refus
              </Button>
            </div>
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Régler le solde — {order.order_number}</SheetTitle>
              <SheetDescription>
                Solde restant : <Price amountXaf={remaining} />
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "mtn_momo" as const, icon: Smartphone, label: PAYMENT_METHOD_LABELS.mtn_momo },
                  { id: "orange_money" as const, icon: Smartphone, label: PAYMENT_METHOD_LABELS.orange_money },
                  { id: "card" as const, icon: CreditCard, label: PAYMENT_METHOD_LABELS.card },
                ]
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMethod(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors",
                    method === option.id
                      ? "border-imperial-gold bg-imperial-gold/10"
                      : "border-imperial-black/15 hover:border-imperial-gold"
                  )}
                >
                  <option.icon className="h-4 w-4 text-imperial-gold" />
                  {option.label}
                </button>
              ))}
            </div>

            {method !== "card" ? (
              <div className="space-y-1.5">
                <Label htmlFor="balance-phone">Numéro payeur</Label>
                <Input
                  id="balance-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatCameroonPhoneInput(e.target.value))}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <Button variant="gold" className="w-full" disabled={!valid || submitting} onClick={handleInitiate}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmer le paiement de <Price amountXaf={remaining} className="ml-1" />
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
