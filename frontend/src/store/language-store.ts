import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "fr" | "en";

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

/** Préférence de langue persistée en localStorage, réhydratée dans AppHydration (comme le panier, la devise n'étant elle jamais persistée). */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "fr",
      setLanguage: (language) => set({ language }),
    }),
    { name: "imperial-collection-language", skipHydration: true }
  )
);
