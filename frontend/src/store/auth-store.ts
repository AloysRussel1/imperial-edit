import { create } from "zustand";
import { persist } from "zustand/middleware";

import { loginAccount, registerAccount } from "@/lib/api";
import type { ApiUser, LoginPayload, RegisterPayload } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: ApiUser | null;
  _hasHydrated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setHasHydrated: (value: boolean) => void;
}

/**
 * Jetons JWT stockés en localStorage (via le middleware persist), comme le
 * reste de l'état client de l'application (panier, commandes). Compromis
 * assumé : plus simple qu'un cookie httpOnly, mais exposé en cas de faille XSS
 * côté frontend — acceptable pour cette démo, à durcir avant une mise en
 * production réelle (cookies httpOnly + refresh côté serveur).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      login: async (payload) => {
        const { tokens, user } = await loginAccount(payload);
        set({ accessToken: tokens.access, refreshToken: tokens.refresh, user });
      },
      register: async (payload) => {
        const { tokens, user } = await registerAccount(payload);
        set({ accessToken: tokens.access, refreshToken: tokens.refresh, user });
      },
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      setAccessToken: (token) => set({ accessToken: token }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    { name: "imperial-collection-auth", skipHydration: true }
  )
);
