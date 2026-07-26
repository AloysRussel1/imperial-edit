import type { ProductType, StockStatus } from "@/types";

export const SITE_NAME = "The Imperial Collection";

/** Numéro WhatsApp officiel du service client Imperial Collection (format international, sans "+"). */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "237696000388";

export const EUR_XAF_RATE = 655.957;

export const DEPOSIT_PERCENTAGES = [50, 70] as const;

export const NAV_LINKS = [
  { labelKey: "nav.newArrivals", href: "/products?sort=new" },
  { labelKey: "nav.catalog", href: "/products" },
  { labelKey: "nav.sourcing", href: "/sourcing" },
  { labelKey: "nav.tracking", href: "/tracking" },
  { labelKey: "nav.about", href: "/about" },
] as const;

export const PRICE_BANDS = [
  { label: "Moins de 100 000 XAF", min: 0, max: 100_000 },
  { label: "100 000 – 300 000 XAF", min: 100_000, max: 300_000 },
  { label: "300 000 – 600 000 XAF", min: 300_000, max: 600_000 },
  { label: "600 000 XAF et plus", min: 600_000, max: Infinity },
] as const;

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  bags: "Sacs",
  shoes: "Chaussures",
  clothing: "Vêtements",
  perfumes: "Parfums",
  watches: "Montres",
  other: "Autre",
};

export const CATALOG_PRODUCT_TYPES: ProductType[] = ["bags", "shoes", "clothing", "perfumes", "watches"];

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "En stock",
  made_to_order: "Sur commande",
  limited: "Pièce limitée",
};

export const DELIVERY_LOCATIONS = [
  { group: "Cameroun", cities: ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Bamenda", "Buea"] },
  { group: "France", cities: ["Paris (retrait ou envoi local)"] },
] as const;

export const PAYMENT_METHOD_LABELS = {
  mtn_momo: "MTN Mobile Money",
  orange_money: "Orange Money",
  card: "Carte bancaire",
} as const;

export function buildWhatsAppMessageLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
