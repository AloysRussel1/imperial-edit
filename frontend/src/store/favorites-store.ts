import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  basePriceXaf: number;
}

interface FavoritesState {
  items: FavoriteItem[];
  toggle: (item: FavoriteItem) => void;
  isFavorite: (productId: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.productId === item.productId);
          return {
            items: exists
              ? state.items.filter((i) => i.productId !== item.productId)
              : [...state.items, item],
          };
        }),
      isFavorite: (productId) => get().items.some((i) => i.productId === productId),
      clear: () => set({ items: [] }),
    }),
    { name: "imperial-collection-favorites", skipHydration: true }
  )
);
