import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SourcingRequestRecord, SourcingStatus } from "@/types";

const SEED_REQUESTS: SourcingRequestRecord[] = [
  {
    id: "sourcing-seed-1",
    created_at: "2026-07-10T11:00:00.000Z",
    customer_name: "Aïcha M.",
    contact: "+237670000001",
    product_name: "Sneakers blanches vues sur Instagram",
    category: "shoes",
    size_or_shoe: "42",
    budget_max_xaf: 150_000,
    description:
      "Modèle repéré sur le compte Instagram @streetlux, semelle épaisse, logo discret sur le talon.",
    image_data_url: null,
    status: "quoted",
    quoted_price_xaf: 138_000,
    admin_note: "Disponible chez un partenaire à Paris, délai estimé 15 jours.",
  },
  {
    id: "sourcing-seed-2",
    created_at: "2026-07-20T16:00:00.000Z",
    customer_name: "Bertrand K.",
    contact: "+237690000002",
    product_name: "",
    category: "bags",
    size_or_shoe: "",
    budget_max_xaf: 400_000,
    description: "Sac à main structuré en cuir noir, vu porté par une influenceuse camerounaise récemment.",
    image_data_url: null,
    status: "pending",
    quoted_price_xaf: null,
    admin_note: "",
  },
];

interface SourcingState {
  requests: SourcingRequestRecord[];
  addRequest: (request: SourcingRequestRecord) => void;
  setQuote: (id: string, priceXaf: number, note: string) => void;
  decline: (id: string, note: string) => void;
  accept: (id: string) => void;
}

export const useSourcingStore = create<SourcingState>()(
  persist(
    (set) => ({
      requests: SEED_REQUESTS,
      addRequest: (request) => set((state) => ({ requests: [request, ...state.requests] })),
      setQuote: (id, priceXaf, note) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id
              ? ({ ...r, status: "quoted", quoted_price_xaf: priceXaf, admin_note: note } satisfies SourcingRequestRecord)
              : r
          ),
        })),
      decline: (id, note) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? ({ ...r, status: "declined", admin_note: note } satisfies SourcingRequestRecord) : r
          ),
        })),
      accept: (id) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            (r.id === id ? { ...r, status: "accepted" as SourcingStatus } : r)
          ),
        })),
    }),
    { name: "imperial-edit-sourcing", skipHydration: true }
  )
);
