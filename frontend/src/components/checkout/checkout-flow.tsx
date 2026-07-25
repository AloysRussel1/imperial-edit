"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AxiosError } from "axios";
import { CreditCard, Loader2, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Price } from "@/components/common/price";
import { Stepper } from "@/components/checkout/stepper";
import { checkoutOrder, fetchOrder, initiatePayment, simulateSandboxPaymentOutcome } from "@/lib/api";
import { DELIVERY_LOCATIONS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { cartTotalXaf, useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { useOrdersStore } from "@/store/orders-store";
import type { ApiOrder, ApiTransaction, DepositPercentage, PaymentMethod } from "@/types";

const STEP_LABELS = ["Livraison", "Acompte", "Paiement", "Confirmation"];

type PaymentPlan = "deposit50" | "deposit70" | "full";

const PLAN_TO_PERCENTAGE: Record<PaymentPlan, DepositPercentage | 100> = {
  deposit50: 50,
  deposit70: 70,
  full: 100,
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function CheckoutFlow() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const addOrder = useOrdersStore((state) => state.addOrder);

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [city, setCity] = useState("");

  const [plan, setPlan] = useState<PaymentPlan>("deposit50");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mtn_momo");
  const [payerPhone, setPayerPhone] = useState("");

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [transaction, setTransaction] = useState<ApiTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cartTotalXaf(items);
  const percentage = PLAN_TO_PERCENTAGE[plan];
  const depositAmount = Math.round((total * percentage) / 100);
  const remainingAmount = total - depositAmount;

  const step1Valid = shippingAddress.trim().length > 0 && city.length > 0;
  const step3Valid = paymentMethod === "card" || payerPhone.trim().length > 0;

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <p className="text-imperial-black/70">
          Connectez-vous pour finaliser votre commande — elle est associée à votre compte pour le suivi et le
          paiement du solde.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="gold">
            <Link href="/login?next=/checkout">Se connecter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Créer un compte</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !order) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <p className="text-imperial-black/60">Votre panier est vide, rien à commander pour l&apos;instant.</p>
        <Button asChild variant="gold">
          <Link href="/products">Découvrir le catalogue</Link>
        </Button>
      </div>
    );
  }

  async function handleConfirmAndPay() {
    setError(null);
    setSubmitting(true);
    try {
      const createdOrder = await checkoutOrder({
        items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
        deposit_percentage: percentage,
        shipping_address: shippingAddress,
        delivery_city: city,
        payment_method: paymentMethod,
      });

      const txn = await initiatePayment({
        order_id: createdOrder.id,
        // Le backend bascule automatiquement sur "sandbox" tant qu'aucune clé
        // CinetPay réelle n'est configurée — ce composant n'a rien à savoir
        // de cette décision, il réagit simplement à ce que l'API renvoie.
        provider: "cinetpay",
        purpose: percentage === 100 ? "full" : "deposit",
        payment_method: paymentMethod,
        payer_phone_number: paymentMethod === "card" ? undefined : payerPhone,
      });

      setOrder(createdOrder);
      setTransaction(txn);

      if (txn.provider !== "sandbox" && txn.payment_url) {
        // Vraie intégration CinetPay active : on redirige vers le guichet de
        // paiement hébergé, qui renverra le client sur /checkout/success.
        window.location.href = txn.payment_url;
        return;
      }

      setStep(4);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Impossible de finaliser la commande pour le moment. Réessayez dans un instant.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulateOutcome(outcome: "success" | "failed") {
    if (!transaction || !order || !user) return;
    setConfirming(true);
    setError(null);
    try {
      await simulateSandboxPaymentOutcome(transaction.provider_reference, outcome);

      // Le webhook est traité de façon asynchrone (tâche Celery) : on relit la
      // commande à quelques reprises, le temps que le statut se mette à jour.
      let latestOrder = order;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await wait(500);
        latestOrder = await fetchOrder(order.id);
        if (latestOrder.status !== "pending_deposit") break;
      }
      setOrder(latestOrder);

      if (latestOrder.status === "pending_deposit") {
        setError(
          outcome === "failed"
            ? "Paiement refusé (simulation). Vous pouvez réessayer."
            : "La confirmation prend plus de temps que prévu — vérifiez votre commande dans quelques instants."
        );
        return;
      }

      addOrder({
        id: latestOrder.id,
        order_number: latestOrder.order_number,
        status: latestOrder.status,
        currency: latestOrder.currency,
        total_xaf: Number(latestOrder.total_xaf),
        amount_paid_xaf: Number(latestOrder.amount_paid_xaf),
        amount_remaining_xaf: Number(latestOrder.amount_remaining_xaf),
        deposit_percentage: latestOrder.deposit_percentage,
        payment_method: paymentMethod,
        created_at: latestOrder.created_at,
        customer_name: `${user.first_name} ${user.last_name}`.trim(),
        whatsapp_number: user.whatsapp_number,
        delivery_city: latestOrder.delivery_city,
        items: items.map((item) => ({
          productSlug: item.productSlug,
          name: item.name,
          brand: item.brand,
          size: item.size,
          color: item.color,
          imageUrl: item.imageUrl,
          unitPriceXaf: item.unitPriceXaf,
          quantity: item.quantity,
        })),
      });
      clearCart();
      router.push(`/checkout/success?id=${latestOrder.id}&number=${latestOrder.order_number}`);
    } catch {
      setError("Impossible de vérifier le paiement pour le moment.");
    } finally {
      setConfirming(false);
    }
  }

  if (step === 4 && order && transaction) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-lg border border-imperial-gold/30 bg-imperial-gold/5 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-imperial-gold/20">
          <Smartphone className="h-7 w-7 text-imperial-gold" />
        </div>
        <div>
          <h2 className="font-display text-2xl text-imperial-black">Validez le paiement sur votre téléphone</h2>
          <p className="mt-1 text-sm text-imperial-black/60">
            {paymentMethod === "card"
              ? "Une demande de paiement par carte a été initiée."
              : `Une demande de paiement ${PAYMENT_METHOD_LABELS[paymentMethod]} a été envoyée au ${payerPhone}.`}{" "}
            Composez votre code pour confirmer.
          </p>
        </div>

        <div className="rounded-lg border border-imperial-black/10 bg-white p-5 text-left text-sm">
          <div className="flex items-center justify-between">
            <span className="text-imperial-black/50">Commande</span>
            <span className="font-semibold text-imperial-black">{order.order_number}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-imperial-black/50">Référence transaction</span>
            <span className="text-imperial-black">{transaction.provider_reference}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-imperial-black/10 pt-2">
            <span className="text-imperial-black/50">Montant à valider</span>
            <Price amountXaf={Number(transaction.amount_xaf)} className="font-semibold text-imperial-gold" />
          </div>
        </div>

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
        <p className="text-xs text-imperial-black/40">
          Environnement de démonstration : ces boutons simulent la notification que l&apos;agrégateur de
          paiement (CinetPay / Orange / MTN) enverrait normalement à notre serveur.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <Stepper steps={STEP_LABELS} currentStep={step} />

      {step === 1 ? (
        <div className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6">
          <h2 className="font-display text-xl text-imperial-black">Coordonnées &amp; livraison</h2>
          <div className="space-y-1.5">
            <Label htmlFor="checkout-address">Adresse de livraison</Label>
            <Input
              id="checkout-address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Quartier, rue, point de repère"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="checkout-city">Ville de livraison</Label>
            <select
              id="checkout-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex h-10 w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
            >
              <option value="">Sélectionner une ville</option>
              {DELIVERY_LOCATIONS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <Button variant="gold" disabled={!step1Valid} onClick={() => setStep(2)}>
              Continuer
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5 rounded-lg border border-imperial-black/10 bg-white p-6">
          <h2 className="font-display text-xl text-imperial-black">Option de paiement</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                { id: "deposit50", label: "Acompte 50%", description: "Solde à la livraison" },
                { id: "deposit70", label: "Acompte 70%", description: "Solde à la livraison" },
                { id: "full", label: "Paiement Total", description: "100% aujourd'hui" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPlan(option.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  plan === option.id
                    ? "border-imperial-gold bg-imperial-gold/10"
                    : "border-imperial-black/15 hover:border-imperial-gold"
                )}
              >
                <p className="font-medium text-imperial-black">{option.label}</p>
                <p className="text-xs text-imperial-black/50">{option.description}</p>
              </button>
            ))}
          </div>

          <dl className="space-y-2 rounded-lg bg-imperial-ivory p-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-imperial-black/60">Total de la commande</dt>
              <dd className="font-medium text-imperial-black">
                <Price amountXaf={total} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-imperial-black/60">À régler aujourd&apos;hui</dt>
              <dd className="font-semibold text-imperial-gold">
                <Price amountXaf={depositAmount} />
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-imperial-black/10 pt-2">
              <dt className="text-imperial-black/60">Solde dû à la livraison</dt>
              <dd className="text-imperial-black">
                <Price amountXaf={remainingAmount} />
              </dd>
            </div>
          </dl>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Retour
            </Button>
            <Button variant="gold" onClick={() => setStep(3)}>
              Continuer
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5 rounded-lg border border-imperial-black/10 bg-white p-6">
          <h2 className="font-display text-xl text-imperial-black">Mode de paiement</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                onClick={() => setPaymentMethod(option.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                  paymentMethod === option.id
                    ? "border-imperial-gold bg-imperial-gold/10"
                    : "border-imperial-black/15 hover:border-imperial-gold"
                )}
              >
                <option.icon className="h-5 w-5 text-imperial-gold" />
                <span className="text-sm font-medium text-imperial-black">{option.label}</span>
              </button>
            ))}
          </div>

          {paymentMethod === "card" ? (
            <p className="rounded-md bg-imperial-ivory p-4 text-sm text-imperial-black/60">
              Vous serez redirigé vers une page de paiement sécurisée (CinetPay) pour finaliser le règlement
              par carte bancaire.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="checkout-payer-phone">
                Numéro {PAYMENT_METHOD_LABELS[paymentMethod]} du payeur
              </Label>
              <Input
                id="checkout-payer-phone"
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
          )}

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
              Retour
            </Button>
            <Button variant="gold" disabled={!step3Valid || submitting} onClick={handleConfirmAndPay}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmer et payer <Price amountXaf={depositAmount} className="ml-1" />
            </Button>
          </div>
        </div>
      ) : null}

      {step !== 4 ? (
        <div className="space-y-3 rounded-lg border border-imperial-black/10 bg-white p-6">
          <h3 className="text-xs uppercase tracking-widest2 text-imperial-black/50">
            Récapitulatif ({items.length} article{items.length > 1 ? "s" : ""})
          </h3>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-3 text-sm">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-imperial-ivory">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill sizes="40px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-imperial-black">{item.name}</p>
                  <p className="text-xs text-imperial-black/45">
                    {item.size} · {item.color} · x{item.quantity}
                  </p>
                </div>
                <Price amountXaf={item.unitPriceXaf * item.quantity} className="text-imperial-black" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Badge variant="outline" className="mx-auto block w-fit text-center">
        Paiement sécurisé via CinetPay — Mobile Money &amp; carte bancaire
      </Badge>
    </div>
  );
}
