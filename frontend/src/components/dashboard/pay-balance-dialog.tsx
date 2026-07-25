"use client";

import { useState } from "react";
import { CreditCard, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Price } from "@/components/common/price";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/store/orders-store";
import type { OrderRecord, PaymentMethod } from "@/types";

interface PayBalanceDialogProps {
  order: OrderRecord;
}

export function PayBalanceDialog({ order }: PayBalanceDialogProps) {
  const markBalancePaid = useOrdersStore((state) => state.markBalancePaid);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("mtn_momo");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  function handlePay() {
    markBalancePaid(order.id);
    setConfirmed(true);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmed(false);
      setPhone("");
    }
  }

  const valid = method === "card" || phone.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="gold">
          Payer le solde
        </Button>
      </DialogTrigger>
      <DialogContent>
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
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Régler le solde — {order.order_number}</DialogTitle>
              <DialogDescription>
                Solde restant : <Price amountXaf={order.amount_remaining_xaf} />
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "mtn_momo" as const, icon: Smartphone, label: "MTN MoMo" },
                  { id: "orange_money" as const, icon: Smartphone, label: "Orange Money" },
                  { id: "card" as const, icon: CreditCard, label: "Carte bancaire" },
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
                <Input id="balance-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" />
              </div>
            ) : null}

            <Button variant="gold" className="w-full" disabled={!valid} onClick={handlePay}>
              Confirmer le paiement de <Price amountXaf={order.amount_remaining_xaf} className="ml-1" />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
