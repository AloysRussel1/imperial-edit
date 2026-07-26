import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { EUR_XAF_RATE } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import type {
  AdminDashboardSummary,
  ApiOrder,
  ApiOrderStatus,
  ApiOrderTracking,
  ApiProduct,
  ApiSourcingRequest,
  ApiTransaction,
  ApiUser,
  AuthTokens,
  CheckoutPayload,
  InitiatePaymentPayload,
  LoginPayload,
  ProductAvailability,
  ProductDetail,
  RegisterPayload,
} from "@/types";

// Toutes les routes de l'API Django vivent sous le préfixe `/api/`
// (core/urls.py). Que la variable d'environnement soit saisie avec ou sans ce
// suffixe (ex. Vercel configuré à la main avec juste le domaine Render), on le
// garantit ici une bonne fois pour toutes plutôt que de dépendre de la
// rigueur de chaque saisie manuelle — sans ça, tous les appels
// (`/auth/register/`, `/products/`...) partent vers la racine du domaine au
// lieu de `/api/...` et échouent en silence (404) en production.
function withApiSuffix(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

// Le navigateur (hors conteneur) doit passer par le port publié sur l'hôte ;
// le rendu serveur Next.js (à l'intérieur du réseau Docker) doit joindre le
// service "web" par son nom, "localhost" n'y désignant pas le backend.
// `NEXT_PUBLIC_API_URL` est le nom canonique (utilisé sur Vercel, où
// navigateur et rendu serveur joignent tous deux la même API publique sur
// Render — pas de réseau Docker interne) ; `NEXT_PUBLIC_API_BASE_URL` reste
// supporté pour la config Docker locale existante. Le repli de secours pointe
// vers le backend Render réel plutôt que vers localhost : si la variable
// Vercel est absente, on tape encore le bon serveur au lieu d'une adresse
// inatteignable depuis une fonction serverless.
const PUBLIC_API_BASE_URL = withApiSuffix(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://imperial-backend.onrender.com"
);
const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL
  ? withApiSuffix(process.env.INTERNAL_API_BASE_URL)
  : PUBLIC_API_BASE_URL;

// Le plan gratuit Render met le backend en veille après une période
// d'inactivité : le premier appel qui le réveille peut prendre plusieurs
// secondes avant de répondre. 20s laisse large la marge pour ce cold start
// sans pour autant bloquer indéfiniment une requête réellement en échec.
const REQUEST_TIMEOUT_MS = 20_000;

export const apiClient = axios.create({
  baseURL: typeof window === "undefined" ? INTERNAL_API_BASE_URL : PUBLIC_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});
// Pas de Content-Type par défaut : axios détecte automatiquement JSON (objet)
// vs multipart/form-data (FormData, pour l'upload de photo) requête par requête.

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{ access: string }>(`${apiClient.defaults.baseURL}/auth/refresh/`, {
      refresh: refreshToken,
    });
    useAuthStore.getState().setAccessToken(data.access);
    return data.access;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

// Nombre de nouvelles tentatives pour une requête qui échoue par timeout /
// erreur réseau / 504 — signature typique d'un backend Render encore en train
// de se réveiller (cold start), pas d'une erreur métier à ne pas répéter.
const MAX_COLD_START_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function isColdStartError(error: AxiosError): boolean {
  return error.code === "ECONNABORTED" || error.response?.status === 504 || !error.response;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean; _retryCount?: number })
      | undefined;

    // Uniquement les requêtes idempotentes (GET) : rejouer un POST (connexion,
    // inscription, soumission de sourcing, checkout...) après un simple
    // timeout risquerait de le déclencher une seconde fois côté serveur si la
    // première tentative avait en réalité fini par aboutir (réponse perdue en
    // route plutôt que requête jamais traitée) — double compte, double
    // demande de sourcing, etc. Pour ces appels, on préfère laisser l'erreur
    // remonter telle quelle au formulaire (qui l'affiche déjà proprement).
    const isIdempotent = (original?.method ?? "get").toLowerCase() === "get";

    if (original && isIdempotent && isColdStartError(error)) {
      original._retryCount = (original._retryCount ?? 0) + 1;
      if (original._retryCount <= MAX_COLD_START_RETRIES) {
        await wait(RETRY_DELAY_MS);
        return apiClient(original);
      }
    }

    if (error.response?.status === 401 && original && !original._retried && useAuthStore.getState().refreshToken) {
      original._retried = true;
      refreshPromise ??= refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  }
);

function deriveAvailability(product: ApiProduct): ProductAvailability {
  const hasStock = product.variants.some((v) => v.is_in_stock);
  return {
    status: hasStock ? "in_stock" : "made_to_order",
    location: "Paris",
    delivery_estimate: hasStock ? "7 à 10 jours vers le Cameroun" : "15 à 21 jours vers le Cameroun",
  };
}

function mapApiProduct(product: ApiProduct): ProductDetail {
  const base_price_xaf = Number(product.base_price_xaf);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    product_type: product.product_type,
    brand: product.brand,
    price_eur: Math.round(base_price_xaf / EUR_XAF_RATE),
    base_price_xaf,
    compare_at_price_xaf: product.compare_at_price_xaf ? Number(product.compare_at_price_xaf) : null,
    is_on_sale: product.is_on_sale,
    is_featured: product.is_featured,
    description: product.description,
    category: product.category,
    default_deposit_percentage: product.default_deposit_percentage,
    availability: deriveAvailability(product),
    images: product.images.map((image) => ({
      id: image.id,
      url: image.image,
      alt: `${product.name} — photo ${image.position + 1}`,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      price_override_xaf: variant.price_override_xaf ? Number(variant.price_override_xaf) : null,
      price_xaf: Number(variant.price_xaf),
      stock_quantity: variant.stock_quantity,
      available_quantity: variant.available_quantity,
      is_in_stock: variant.is_in_stock,
    })),
  };
}

export async function fetchProducts(): Promise<ProductDetail[]> {
  const { data } = await apiClient.get<{ results: ApiProduct[] }>("/products/");
  return data.results.map(mapApiProduct);
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  try {
    const { data } = await apiClient.get<ApiProduct>(`/products/${slug}/`);
    return mapApiProduct(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// ---- Authentification ----

export async function registerAccount(payload: RegisterPayload): Promise<{ tokens: AuthTokens; user: ApiUser }> {
  await apiClient.post("/auth/register/", payload);
  // L'inscription ne renvoie pas de session : on enchaîne avec une connexion
  // immédiate pour offrir une expérience "inscription = déjà connecté".
  return loginAccount({ email: payload.email, password: payload.password });
}

export async function loginAccount(payload: LoginPayload): Promise<{ tokens: AuthTokens; user: ApiUser }> {
  const { data: tokens } = await apiClient.post<AuthTokens>("/auth/login/", {
    username: payload.email,
    password: payload.password,
  });
  const { data: user } = await apiClient.get<ApiUser>("/auth/me/", {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });
  return { tokens, user };
}

/**
 * Réponse volontairement générique côté backend (que l'e-mail corresponde à un
 * compte ou non) — évite de révéler l'existence d'un compte à un tiers.
 */
export async function requestPasswordReset(email: string): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>("/auth/password-reset/", { email });
  return data;
}

export async function confirmPasswordReset(
  uid: string,
  token: string,
  newPassword: string
): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>("/auth/password-reset/confirm/", {
    uid,
    token,
    new_password: newPassword,
  });
  return data;
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  const { data } = await apiClient.get<ApiUser>("/auth/me/");
  return data;
}

// ---- Sourcing ----

export interface SubmitSourcingPayload {
  product_name: string;
  category: string;
  size_or_shoe: string;
  budget_max_xaf: number | null;
  description: string;
  source_url?: string;
  image: File | null;
}

export async function submitSourcingRequest(payload: SubmitSourcingPayload): Promise<ApiSourcingRequest> {
  const form = new FormData();
  form.append("product_name", payload.product_name);
  form.append("category", payload.category);
  form.append("size_or_shoe", payload.size_or_shoe);
  if (payload.budget_max_xaf !== null) {
    form.append("budget_max_xaf", String(payload.budget_max_xaf));
  }
  form.append("description", payload.description);
  if (payload.source_url) form.append("source_url", payload.source_url);
  if (payload.image) form.append("reference_image", payload.image);

  const { data } = await apiClient.post<ApiSourcingRequest>("/sourcing/requests/", form);
  return data;
}

// ---- Commande & paiement ----

export async function checkoutOrder(payload: CheckoutPayload): Promise<ApiOrder> {
  const { data } = await apiClient.post<ApiOrder>("/orders/checkout/", payload);
  return data;
}

export async function fetchOrder(orderId: string): Promise<ApiOrder> {
  const { data } = await apiClient.get<ApiOrder>(`/orders/${orderId}/`);
  return data;
}

/** Toujours restreint au compte connecté, quel que soit son rôle (admin inclus). */
export async function fetchMyOrders(): Promise<ApiOrder[]> {
  const { data } = await apiClient.get<ApiOrder[]>("/orders/my-orders/");
  return data;
}

/**
 * Suivi de colis public — aucune authentification requise. `lookup` accepte le
 * numéro de suivi (`IC-2026-X89B`, saisi par le client) ou l'id technique de
 * la commande (utilisé par les liens internes déjà connectés).
 */
export async function fetchOrderTracking(lookup: string): Promise<ApiOrderTracking> {
  const { data } = await apiClient.get<ApiOrderTracking>(`/orders/${encodeURIComponent(lookup)}/tracking/`);
  return data;
}

export async function initiatePayment(payload: InitiatePaymentPayload): Promise<ApiTransaction> {
  const { data } = await apiClient.post<ApiTransaction>("/payments/initiate/", payload);
  return data;
}

/**
 * Environnement de démonstration : aucune clé API CinetPay/Flutterwave réelle
 * n'est configurée, donc aucun agrégateur externe ne peut appeler notre
 * webhook. On simule ici exactement l'appel qu'un agrégateur ferait une fois
 * le paiement Mobile Money validé sur le téléphone du client.
 */
export async function simulateSandboxPaymentOutcome(
  reference: string,
  outcome: "success" | "failed"
): Promise<void> {
  await apiClient.post("/payments/webhook/", { provider: "sandbox", reference, status: outcome });
}

// ---- Back-office / administration ----
// Ces fonctions appellent les mêmes endpoints que côté client : le backend
// élargit automatiquement le résultat (toutes les commandes / demandes, pas
// seulement celles de l'utilisateur courant) lorsque son rôle est "admin".

export async function fetchAdminSummary(): Promise<AdminDashboardSummary> {
  const { data } = await apiClient.get<AdminDashboardSummary>("/orders/admin-summary/");
  return data;
}

export async function fetchAllOrders(): Promise<ApiOrder[]> {
  const { data } = await apiClient.get<{ results: ApiOrder[] }>("/orders/");
  return data.results;
}

export async function advanceOrderStatus(
  orderId: string,
  status: ApiOrderStatus,
  note?: string
): Promise<ApiOrder> {
  const { data } = await apiClient.post<ApiOrder>(`/orders/${orderId}/advance_status/`, { status, note });
  return data;
}

export async function settleOrderBalance(
  orderId: string,
  paymentMethod: "cash_on_delivery" | "momo_on_delivery" = "cash_on_delivery"
): Promise<ApiOrder> {
  const { data } = await apiClient.post<ApiOrder>(`/orders/${orderId}/settle_balance/`, {
    payment_method: paymentMethod,
  });
  return data;
}

export async function fetchAllSourcingRequests(): Promise<ApiSourcingRequest[]> {
  const { data } = await apiClient.get<{ results: ApiSourcingRequest[] }>("/sourcing/requests/");
  return data.results;
}

export async function quoteSourcingRequest(
  id: string,
  quotedPriceXaf: number,
  adminNotes: string
): Promise<ApiSourcingRequest> {
  const { data } = await apiClient.post<ApiSourcingRequest>(`/sourcing/requests/${id}/quote/`, {
    quoted_price_xaf: quotedPriceXaf,
    admin_notes: adminNotes,
  });
  return data;
}

export async function rejectSourcingRequest(id: string, adminNotes: string): Promise<ApiSourcingRequest> {
  const { data } = await apiClient.post<ApiSourcingRequest>(`/sourcing/requests/${id}/reject/`, {
    admin_notes: adminNotes,
  });
  return data;
}
