"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useLanguageStore } from "@/store/language-store";

/** Réhydrate les stores persistés (localStorage) une fois côté client, pour éviter tout écart SSR/CSR. */
export function AppHydration() {
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    useLanguageStore.persist.rehydrate();
    Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => {
      useAuthStore.getState().setHasHydrated(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
