import { create } from "zustand";

import type { Currency } from "@/types";

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()((set) => ({
  currency: "XAF",
  setCurrency: (currency) => set({ currency }),
}));
