"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import {
  AlertTriangle,
  Banknote,
  Loader2,
  Minus,
  Plus,
  Printer,
  Receipt,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { createPosSale, fetchVendorProducts } from "@/lib/api";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import type { ApiOrder, PaymentMethod, ProductDetail, ProductVariant } from "@/types";

interface TicketLine {
  variantId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPriceXaf: number;
  availableQuantity: number;
  quantity: number;
}

// En-dessous de ce seuil, le stock reste vendable mais mérite un signal
// visuel — repérer d'un coup d'œil qu'il faut penser à réapprovisionner
// avant la prochaine vente de cet article.
const LOW_STOCK_THRESHOLD = 5;

function variantLabel(variant: ProductVariant): string {
  const parts = [variant.size, variant.color].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Unique";
}

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity <= 0) {
    return (
      <Badge variant="sale" className="shrink-0 gap-1">
        <AlertTriangle className="h-3 w-3" /> Rupture
      </Badge>
    );
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return (
      <Badge variant="warning" className="shrink-0 gap-1">
        <AlertTriangle className="h-3 w-3" /> En stock : {quantity}
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="shrink-0">
      En stock : {quantity}
    </Badge>
  );
}

export function VendorPosTab() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ApiOrder | null>(null);

  useEffect(() => {
    fetchVendorProducts()
      .then(setProducts)
      .catch(() => setLoadError("Impossible de charger le catalogue pour le moment."));
  }, []);

  // Aucune liste tant qu'aucune recherche n'est saisie — le catalogue complet
  // n'a pas sa place ici, la caisse doit rester rapide à l'usage (retrouver un
  // article en une frappe, pas parcourir des pages).
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !products) return [];
    return products
      .filter((product) => product.is_active)
      .filter(
        (product) =>
          product.name.toLowerCase().includes(q) || product.variants.some((v) => v.sku.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [query, products]);

  const total = ticket.reduce((sum, line) => sum + line.unitPriceXaf * line.quantity, 0);

  // Touche Entrée = ajout instantané, sans lâcher le clavier — le geste
  // naturel d'une douchette qui scanne un code-barres puis envoie un retour
  // chariot. Priorité à une correspondance exacte de référence (SKU), seul
  // cas où l'article visé n'est jamais ambigu ; sinon, uniquement si la
  // recherche ne laisse qu'un seul produit à variante unique — jamais un
  // choix arbitraire entre plusieurs articles, qui encaisserait le mauvais.
  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    if (results.length === 0) return;
    const q = query.trim().toLowerCase();

    for (const product of results) {
      const exactVariant = product.variants.find((v) => v.sku.toLowerCase() === q);
      if (exactVariant) {
        addVariant(product, exactVariant);
        setQuery("");
        return;
      }
    }

    const [onlyResult, secondResult] = results;
    const [onlyVariant, secondVariant] = onlyResult?.variants ?? [];
    if (onlyResult && !secondResult && onlyVariant && !secondVariant) {
      addVariant(onlyResult, onlyVariant);
      setQuery("");
    }
  }

  function addVariant(product: ProductDetail, variant: ProductVariant) {
    if (variant.available_quantity <= 0) {
      toast.error("Rupture de stock pour cette variante.");
      return;
    }
    setTicket((prev) => {
      const existing = prev.find((line) => line.variantId === variant.id);
      if (existing) {
        if (existing.quantity >= variant.available_quantity) {
          toast.error("Stock disponible atteint pour cette variante.");
          return prev;
        }
        return prev.map((line) => (line.variantId === variant.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: product.name,
          variantLabel: variantLabel(variant),
          sku: variant.sku,
          unitPriceXaf: variant.price_xaf,
          availableQuantity: variant.available_quantity,
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(variantId: string, quantity: number) {
    setTicket((prev) => {
      if (quantity <= 0) return prev.filter((line) => line.variantId !== variantId);
      return prev.map((line) =>
        line.variantId === variantId ? { ...line, quantity: Math.min(quantity, line.availableQuantity) } : line
      );
    });
  }

  function removeLine(variantId: string) {
    setTicket((prev) => prev.filter((line) => line.variantId !== variantId));
  }

  function resetSale() {
    setTicket([]);
    setCustomerEmail("");
    setPaymentMethod("cash");
    setError(null);
    setReceipt(null);
  }

  async function handleValidate() {
    if (ticket.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const order = await createPosSale({
        items: ticket.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
        payment_method: paymentMethod,
        customer_email: customerEmail.trim() || undefined,
      });
      setReceipt(order);
      setTicket([]);
      setCustomerEmail("");
      // Le stock vient de bouger côté serveur (décompte immédiat, pas de simple
      // réservation) — on recharge le catalogue pour que les stocks affichés à
      // la prochaine vente soient à jour.
      fetchVendorProducts()
        .then(setProducts)
        .catch(() => undefined);
      toast.success(`Vente ${order.order_number} validée.`);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Impossible de valider la vente pour le moment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (receipt) {
    return <PosReceipt order={receipt} onNewSale={resetSale} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-imperial-black">Caisse</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-imperial-black/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit ou scanner une référence…"
              className="pl-9"
              autoFocus
            />
          </form>

          {loadError ? (
            <p className="text-sm text-red-700">{loadError}</p>
          ) : query.trim().length === 0 ? (
            <p className="rounded-lg border border-dashed border-imperial-black/15 py-10 text-center text-sm text-imperial-black/45">
              Tapez le nom d&apos;un produit ou une référence pour commencer.
            </p>
          ) : products === null ? (
            <div className="flex items-center justify-center gap-2 py-10 text-imperial-black/50">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement du catalogue…
            </div>
          ) : results.length === 0 ? (
            <p className="rounded-lg border border-dashed border-imperial-black/15 py-10 text-center text-sm text-imperial-black/45">
              Aucun résultat pour « {query} ».
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {results.map((product) => {
                const cover = product.images[0];
                return (
                  <div key={product.id} className="flex gap-3 rounded-lg border border-imperial-black/10 bg-white p-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-imperial-ivory">
                      {cover ? (
                        <Image
                          src={cover.url}
                          alt={cover.alt}
                          fill
                          unoptimized
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <PlaceholderImage
                          hue={30}
                          productType={product.product_type}
                          className="absolute inset-0"
                          iconClassName="h-5 w-5"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-imperial-black">{product.name}</p>
                      <p className="text-xs text-imperial-black/45">
                        {PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}
                      </p>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {product.variants.map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={variant.available_quantity <= 0}
                            onClick={() => addVariant(product, variant)}
                            className="flex w-full items-center justify-between gap-3 rounded-md border border-imperial-black/10 px-2.5 py-1.5 text-left text-xs transition-colors hover:border-imperial-gold hover:bg-imperial-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-imperial-black">
                                {variantLabel(variant)}
                              </span>
                              <span className="block truncate text-imperial-black/40">{variant.sku}</span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1">
                              <span className="font-medium text-imperial-black">
                                {formatPrice(variant.price_xaf, "XAF")}
                              </span>
                              <StockBadge quantity={variant.available_quantity} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-xl border border-imperial-black/10 bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-base text-imperial-black">
            <Receipt className="h-4 w-4" /> Ticket
          </h3>

          {ticket.length === 0 ? (
            <p className="flex-1 py-8 text-center text-sm text-imperial-black/45">Ticket vide.</p>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto">
              {ticket.map((line) => (
                <div
                  key={line.variantId}
                  className="flex items-start justify-between gap-2 border-b border-imperial-black/5 pb-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-imperial-black">{line.productName}</p>
                    <p className="text-xs text-imperial-black/45">
                      {line.variantLabel} · {line.sku}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-imperial-black/15 text-imperial-black/60 hover:bg-imperial-black/5"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                      disabled={line.quantity >= line.availableQuantity}
                      className="flex h-6 w-6 items-center justify-center rounded border border-imperial-black/15 text-imperial-black/60 hover:bg-imperial-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLine(line.variantId)}
                      className="ml-1 flex h-6 w-6 items-center justify-center rounded text-imperial-black/40 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">
                    {formatPrice(line.unitPriceXaf * line.quantity, "XAF")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-3 border-t border-imperial-black/10 pt-3">
            <div className="flex items-center justify-between text-base font-semibold text-imperial-black">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(total, "XAF")}</span>
            </div>

            <div className="space-y-1.5">
              <Label>Mode de paiement</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border-2 py-2 text-sm transition-colors",
                    paymentMethod === "cash"
                      ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                      : "border-imperial-black/10 text-imperial-black/60 hover:border-imperial-black/25"
                  )}
                >
                  <Banknote className="h-4 w-4" /> Espèces
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("mtn_momo")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border-2 py-2 text-sm transition-colors",
                    paymentMethod !== "cash"
                      ? "border-imperial-gold bg-imperial-gold/10 text-imperial-black"
                      : "border-imperial-black/10 text-imperial-black/60 hover:border-imperial-black/25"
                  )}
                >
                  <Smartphone className="h-4 w-4" /> Mobile Money
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pos-customer-email">E-mail client (facultatif, pour le reçu)</Label>
              <Input
                id="pos-customer-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="client@exemple.com"
              />
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              disabled={ticket.length === 0 || submitting}
              onClick={handleValidate}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? "Validation…" : "Valider la vente"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PosReceipt({ order, onNewSale }: { order: ApiOrder; onNewSale: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h2 className="font-display text-xl text-imperial-black">Vente validée</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimer le reçu
          </Button>
          <Button variant="gold" size="sm" onClick={onNewSale}>
            Nouvelle vente
          </Button>
        </div>
      </div>

      <div id="pos-receipt-print" className="mx-auto max-w-sm space-y-4 rounded-xl border border-imperial-black/10 bg-white p-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-imperial-gold">Imperial Collection</p>
          <p className="mt-1 text-xs text-imperial-black/50">Boutique de Yaoundé</p>
        </div>
        <div className="flex justify-between text-xs text-imperial-black/60">
          <span>{order.order_number}</span>
          <span>{new Date(order.created_at).toLocaleString("fr-FR")}</span>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-dashed border-imperial-black/10">
                <td className="py-1.5">
                  <p className="font-medium text-imperial-black">{item.product_name_snapshot}</p>
                  <p className="text-xs text-imperial-black/45">
                    {item.sku_snapshot} × {item.quantity}
                  </p>
                </td>
                <td className="py-1.5 text-right tabular-nums">{formatPrice(Number(item.line_total_xaf), "XAF")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between border-t border-imperial-black/10 pt-3 text-base font-semibold text-imperial-black">
          <span>Total réglé</span>
          <span className="tabular-nums">{formatPrice(Number(order.total_xaf), "XAF")}</span>
        </div>
        <p className="text-center text-xs text-imperial-black/45">
          Réglé par {order.payment_method === "cash" ? "espèces" : "Mobile Money"}
        </p>
        {order.customer_email ? (
          <p className="text-center text-xs text-imperial-black/45">Reçu envoyé à {order.customer_email}</p>
        ) : null}
      </div>
    </div>
  );
}
