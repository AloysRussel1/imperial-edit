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
import { useTranslation } from "@/hooks/use-translation";
import { checkoutOrder, fetchOrder, initiatePayment, simulateSandboxPaymentOutcome } from "@/lib/api";
import { DELIVERY_LOCATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { cartTotalXaf, useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import type { ApiOrder, ApiTransaction, DepositPercentage, PaymentMethod } from "@/types";

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
  const { t, tList } = useTranslation();
  const paymentMethodLabels: Record<PaymentMethod, string> = {
    mtn_momo: t("checkout.paymentMethods.mtn_momo"),
    orange_money: t("checkout.paymentMethods.orange_money"),
    card: t("checkout.paymentMethods.card"),
  };
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [city, setCity] = useState("");

  const [plan, setPlan] = useState<PaymentPlan>("deposit50");
  const [couponCode, setCouponCode] = useState("");

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
        <p className="text-imperial-black/70">{t("checkout.guestPrompt")}</p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="gold">
            <Link href="/login?next=/checkout">{t("checkout.login")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">{t("checkout.createAccount")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !order) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <p className="text-imperial-black/60">{t("checkout.emptyCart")}</p>
        <Button asChild variant="gold">
          <Link href="/products">{t("checkout.discoverCatalog")}</Link>
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
        coupon_code: couponCode.trim() || undefined,
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
        setError(t("checkout.genericError"));
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
        setError(outcome === "failed" ? t("checkout.paymentRefused") : t("checkout.confirmationDelay"));
        return;
      }

      clearCart();
      router.push(`/checkout/success?id=${latestOrder.id}&number=${latestOrder.order_number}`);
    } catch {
      setError(t("checkout.verifyError"));
    } finally {
      setConfirming(false);
    }
  }

  const planOptions = [
    { id: "deposit50" as const, label: t("checkout.planDeposit50Label"), description: t("checkout.planDepositDesc") },
    { id: "deposit70" as const, label: t("checkout.planDeposit70Label"), description: t("checkout.planDepositDesc") },
    { id: "full" as const, label: t("checkout.planFullLabel"), description: t("checkout.planFullDesc") },
  ];

  const paymentMethodOptions = [
    { id: "mtn_momo" as const, icon: Smartphone, label: paymentMethodLabels.mtn_momo },
    { id: "orange_money" as const, icon: Smartphone, label: paymentMethodLabels.orange_money },
    { id: "card" as const, icon: CreditCard, label: paymentMethodLabels.card },
  ];

  if (step === 4 && order && transaction) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-lg border border-imperial-gold/30 bg-imperial-gold/5 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-imperial-gold/20">
          <Smartphone className="h-7 w-7 text-imperial-gold" />
        </div>
        <div>
          <h2 className="font-display text-2xl text-imperial-black">{t("checkout.step4Title")}</h2>
          <p className="mt-1 text-sm text-imperial-black/60">
            {paymentMethod === "card"
              ? t("checkout.step4DescCard")
              : t("checkout.step4DescMobile", { method: paymentMethodLabels[paymentMethod], phone: payerPhone })}{" "}
            {t("checkout.step4DescSuffix")}
          </p>
        </div>

        <div className="rounded-lg border border-imperial-black/10 bg-white p-5 text-left text-sm">
          <div className="flex items-center justify-between">
            <span className="text-imperial-black/50">{t("checkout.orderLabel")}</span>
            <span className="font-semibold text-imperial-black">{order.order_number}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-imperial-black/50">{t("checkout.transactionRefLabel")}</span>
            <span className="text-imperial-black">{transaction.provider_reference}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-imperial-black/10 pt-2">
            <span className="text-imperial-black/50">{t("checkout.amountToConfirmLabel")}</span>
            <Price amountXaf={Number(transaction.amount_xaf)} className="font-semibold text-imperial-gold" />
          </div>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="gold" disabled={confirming} onClick={() => handleSimulateOutcome("success")}>
            {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("checkout.confirmedOnPhone")}
          </Button>
          <Button variant="outline" disabled={confirming} onClick={() => handleSimulateOutcome("failed")}>
            {t("checkout.simulateRefusal")}
          </Button>
        </div>
        <p className="text-xs text-imperial-black/40">{t("checkout.sandboxNotice")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Stepper steps={tList("checkout.steps")} currentStep={step} />

      {/* Récapitulatif toujours visible à droite (desktop) pendant tout le
          tunnel d'achat — remonte au-dessus des étapes sur mobile. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6 lg:order-1">
          {step === 1 ? (
            <div className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6">
              <h2 className="font-display text-xl text-imperial-black">{t("checkout.step1Title")}</h2>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-address">{t("checkout.addressLabel")}</Label>
                <Input
                  id="checkout-address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder={t("checkout.addressPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-city">{t("checkout.cityLabel")}</Label>
                <select
                  id="checkout-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
                >
                  <option value="">{t("checkout.citySelectPlaceholder")}</option>
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
                  {t("checkout.continue")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5 rounded-lg border border-imperial-black/10 bg-white p-6">
              <h2 className="font-display text-xl text-imperial-black">{t("checkout.step2Title")}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {planOptions.map((option) => (
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

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  {t("checkout.back")}
                </Button>
                <Button variant="gold" onClick={() => setStep(3)}>
                  {t("checkout.continue")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5 rounded-lg border border-imperial-black/10 bg-white p-6">
              <h2 className="font-display text-xl text-imperial-black">{t("checkout.step3Title")}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {paymentMethodOptions.map((option) => (
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
                <p className="rounded-md bg-imperial-ivory p-4 text-sm text-imperial-black/60">{t("checkout.cardNotice")}</p>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-payer-phone">
                    {t("checkout.payerPhoneLabel", { method: paymentMethodLabels[paymentMethod] })}
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
                  {t("checkout.back")}
                </Button>
                <Button variant="gold" disabled={!step3Valid || submitting} onClick={handleConfirmAndPay}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("checkout.confirmAndPay")} <Price amountXaf={depositAmount} className="ml-1" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6 lg:sticky lg:top-32 lg:order-2">
          <h3 className="text-xs uppercase tracking-widest2 text-imperial-black/50">
            {t("checkout.summaryTitle")} ({items.length} {items.length > 1 ? t("checkout.articles") : t("checkout.article")})
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

          <div className="space-y-1.5 border-t border-imperial-black/10 pt-3">
            <Label htmlFor="checkout-coupon" className="text-xs">
              Code promo (optionnel)
            </Label>
            <Input
              id="checkout-coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="IMPERIAL10"
              className="h-9 text-sm"
            />
          </div>

          <dl className="space-y-2 rounded-lg bg-imperial-ivory p-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-imperial-black/60">{t("checkout.orderTotalLabel")}</dt>
              <dd className="font-medium text-imperial-black">
                <Price amountXaf={total} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-imperial-black/60">{t("checkout.dueTodayLabel")}</dt>
              <dd className="font-semibold text-imperial-gold">
                <Price amountXaf={depositAmount} />
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-imperial-black/10 pt-2">
              <dt className="text-imperial-black/60">{t("checkout.balanceDueLabel")}</dt>
              <dd className="text-imperial-black">
                <Price amountXaf={remainingAmount} />
              </dd>
            </div>
          </dl>

          <Badge variant="outline" className="mx-auto block w-fit text-center">
            {t("checkout.secureBadge")}
          </Badge>
        </aside>
      </div>
    </div>
  );
}
