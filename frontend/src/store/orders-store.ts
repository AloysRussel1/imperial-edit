import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OrderItemRecord, OrderRecord, OrderStatus } from "@/types";

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?q=80&w=1600&auto=format&fit=crop`;
}

function seedItem(item: Omit<OrderItemRecord, "imageUrl"> & { photoId: string }): OrderItemRecord {
  const { photoId, ...rest } = item;
  return { ...rest, imageUrl: unsplash(photoId) };
}

function buildOrder(
  base: Omit<OrderRecord, "total_xaf" | "amount_paid_xaf" | "amount_remaining_xaf">
): OrderRecord {
  const total_xaf = base.items.reduce((sum, item) => sum + item.unitPriceXaf * item.quantity, 0);
  const amount_paid_xaf =
    base.deposit_percentage === 100 ? total_xaf : Math.round((total_xaf * base.deposit_percentage) / 100);
  return { ...base, total_xaf, amount_paid_xaf, amount_remaining_xaf: total_xaf - amount_paid_xaf };
}

const SEED_ORDERS: OrderRecord[] = [
  buildOrder({
    id: "order-seed-1",
    order_number: "IE-240602-001",
    status: "deposit_paid",
    currency: "XAF",
    deposit_percentage: 70,
    created_at: "2026-06-02T10:00:00.000Z",
    customer_name: "Aïcha M.",
    whatsapp_number: "+237670000001",
    delivery_city: "Douala",
    payment_method: "mtn_momo",
    items: [
      seedItem({
        productSlug: "sac-aurore",
        name: "Sac Aurore",
        brand: "Maison Devereux",
        size: "Unique",
        color: "Rouge",
        photoId: "photo-1584917865442-de89df76afd3",
        unitPriceXaf: 452_610,
        quantity: 1,
      }),
    ],
  }),
  buildOrder({
    id: "order-seed-2",
    order_number: "IE-240615-002",
    status: "in_transit",
    currency: "XAF",
    deposit_percentage: 50,
    created_at: "2026-06-15T09:30:00.000Z",
    customer_name: "Bertrand K.",
    whatsapp_number: "+237690000002",
    delivery_city: "Yaoundé",
    payment_method: "orange_money",
    items: [
      seedItem({
        productSlug: "sneakers-aerial",
        name: "Sneakers Aerial",
        brand: "Lucien Rey",
        size: "42",
        color: "Multicolore",
        photoId: "photo-1560769629-975ec94e6a86",
        unitPriceXaf: 209_906,
        quantity: 1,
      }),
      seedItem({
        productSlug: "blazer-structure-nuit",
        name: "Blazer Structuré Nuit",
        brand: "Atelier Corbin",
        size: "M",
        color: "Noir",
        photoId: "photo-1613915617430-8ab0fd7c6baf",
        unitPriceXaf: 354_217,
        quantity: 1,
      }),
    ],
  }),
  buildOrder({
    id: "order-seed-3",
    order_number: "IE-240701-003",
    status: "completed",
    currency: "XAF",
    deposit_percentage: 100,
    created_at: "2026-07-01T14:00:00.000Z",
    customer_name: "Chantal N.",
    whatsapp_number: "+237655000003",
    delivery_city: "Douala",
    payment_method: "card",
    items: [
      seedItem({
        productSlug: "parfum-ambre-imperial",
        name: "Ambre Impérial — Eau de Parfum 100ml",
        brand: "Maison Devereux",
        size: "100ml",
        color: "Ambre",
        photoId: "photo-1585218334450-afcf929da36e",
        unitPriceXaf: 95_101,
        quantity: 1,
      }),
    ],
  }),
];

interface OrdersState {
  orders: OrderRecord[];
  addOrder: (order: OrderRecord) => void;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  markBalancePaid: (orderId: string) => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: SEED_ORDERS,
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),
      markBalancePaid: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  amount_paid_xaf: o.total_xaf,
                  amount_remaining_xaf: 0,
                  status: o.status === "cancelled" ? o.status : "completed",
                }
              : o
          ),
        })),
    }),
    { name: "imperial-edit-orders", skipHydration: true }
  )
);

export function generateOrderNumber(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `IE-${y}${m}${d}-${rand}`;
}
