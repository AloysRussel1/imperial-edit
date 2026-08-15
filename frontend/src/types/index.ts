export type ProductType = "bags" | "shoes" | "clothing" | "perfumes" | "watches";

export type Currency = "XAF" | "EUR";

export type DepositPercentage = 50 | 70;

export interface Product {
  id: string;
  name: string;
  slug: string;
  product_type: ProductType;
  brand: string;
  price_eur: number;
  base_price_xaf: number;
  compare_at_price_xaf: number | null;
  is_on_sale: boolean;
  is_featured: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export type StockStatus = "in_stock" | "made_to_order" | "limited";

export interface ProductAvailability {
  status: StockStatus;
  location: string;
  delivery_estimate: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  price_override_xaf: number | null;
  price_xaf: number;
  stock_quantity: number;
  available_quantity: number;
  is_in_stock: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductDetail extends Product {
  description: string;
  category: ProductCategory;
  images: ProductImage[];
  variants: ProductVariant[];
  default_deposit_percentage: DepositPercentage;
  availability: ProductAvailability;
  vendorEmail: string | null;
  is_active: boolean;
}

export type OrderStatus =
  | "pending_deposit"
  | "deposit_paid"
  | "sourcing_in_progress"
  | "shipped_from_europe"
  | "arrived_in_cameroon"
  | "delivered_and_completed"
  | "cancelled";

export type PaymentMethod = "mtn_momo" | "orange_money" | "card" | "cash";

// ---- Formes brutes renvoyées par l'API Django (avant adaptation côté frontend) ----

/** Hiérarchie à 3 niveaux : ADMIN (plateforme) > VENDOR (boutique) > CASHIER
 * (caisse de cette boutique). Le vendeur a le CRUD complet sur son
 * catalogue ; le caissier n'a qu'un accès lecture seule + la Caisse (POS). */
export type UserRole = "admin" | "vendor" | "cashier" | "customer";

export interface ApiUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number: string;
  whatsapp_number: string;
  city: string;
  country?: string;
}

/** Compte personnel (vendeur·se ou caissier·e) créé par le niveau
 * hiérarchique juste au-dessus — voir AdminStaffTab (`/auth/staff/`, crée
 * des vendeurs) et VendorCashiersTab (`/vendor/cashiers/`, crée des
 * caissiers). Même forme pour les deux, seul l'endpoint appelé diffère. */
export interface ApiStaffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
}

export interface CreateStaffPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  whatsapp_number?: string;
  city?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ApiProductImage {
  id: string;
  image: string;
  position: number;
}

export interface ApiProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  price_override_xaf: string | null;
  price_xaf: string;
  stock_quantity: number;
  available_quantity: number;
  is_in_stock: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  product_type: ProductType;
  brand: string;
  description: string;
  category: ProductCategory;
  base_price_xaf: string;
  compare_at_price_xaf: string | null;
  is_on_sale: boolean;
  is_active: boolean;
  is_featured: boolean;
  default_deposit_percentage: DepositPercentage;
  images: ApiProductImage[];
  variants: ApiProductVariant[];
  vendor_email: string | null;
}

export interface ApiOrderItem {
  id: string;
  variant: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_xaf: string;
  quantity: number;
  line_total_xaf: string;
}

export type ApiOrderStatus =
  | "pending_deposit"
  | "deposit_paid"
  | "sourcing_in_progress"
  | "shipped_from_europe"
  | "arrived_in_cameroon"
  | "delivered_and_completed"
  | "cancelled";

export interface ApiOrderStatusHistoryEntry {
  id: string;
  status: ApiOrderStatus;
  status_display: string;
  note: string;
  created_at: string;
}

export interface ApiOrder {
  id: string;
  order_number: string;
  tracking_number: string | null;
  status: ApiOrderStatus;
  status_display: string;
  tracking_progress_percent: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  subtotal_xaf: string;
  discount_xaf: string;
  total_xaf: string;
  deposit_percentage: 50 | 70 | 100;
  payment_method: PaymentMethod | "";
  amount_paid_xaf: string;
  amount_remaining_xaf: string;
  deposit_due_xaf: string;
  coupon_code: string;
  shipping_address: string;
  delivery_city: string;
  carrier_notes: string;
  estimated_delivery_date: string | null;
  created_at: string;
  items: ApiOrderItem[];
  status_history: ApiOrderStatusHistoryEntry[];
}

/** Vue publique et restreinte d'une commande (endpoint `/tracking/`, sans authentification). */
export interface ApiOrderTracking {
  order_number: string;
  tracking_number: string | null;
  status: ApiOrderStatus;
  status_display: string;
  tracking_progress_percent: number;
  estimated_delivery_date: string | null;
  delivery_city: string;
  /** "Ville, Pays" — seule information de localisation garantie, que le
   * consultant soit ou non le client propriétaire de la commande. */
  delivery_location: string;
  /** Adresse exacte : uniquement pour le client propriétaire authentifié
   * (voir OrderTrackingSerializer côté backend) — `null` sinon. */
  shipping_address: string | null;
  currency: string;
  total_xaf: string;
  amount_paid_xaf: string;
  amount_remaining_xaf: string;
  deposit_due_xaf: string;
  deposit_percentage: 50 | 70 | 100;
  carrier_notes: string;
  created_at: string;
  status_history: ApiOrderStatusHistoryEntry[];
}

export interface CheckoutPayload {
  items: { variant_id: string; quantity: number }[];
  deposit_percentage: 50 | 70 | 100;
  shipping_address: string;
  delivery_city: string;
  payment_method: PaymentMethod;
  coupon_code?: string;
}

/** Vente comptoir (Caisse, `/api/orders/pos/`) — pas d'acompte ni d'adresse
 * de livraison, réglée intégralement et sur-le-champ. */
export interface POSCheckoutPayload {
  items: { variant_id: string; quantity: number }[];
  payment_method: PaymentMethod;
  customer_email?: string;
}

export type TransactionPurpose = "deposit" | "balance" | "full";
export type TransactionStatus = "pending" | "success" | "failed";

export interface ApiTransaction {
  id: string;
  order: string;
  provider: string;
  purpose: TransactionPurpose;
  status: TransactionStatus;
  amount_xaf: string;
  provider_reference: string;
  payer_phone_number: string;
  payment_url: string;
  created_at: string;
}

export interface InitiatePaymentPayload {
  order_id: string;
  provider: "sandbox" | "cinetpay" | "flutterwave";
  purpose: TransactionPurpose;
  payment_method?: PaymentMethod;
  payer_phone_number?: string;
}

export type ApiSourcingStatus = "new" | "under_review" | "quoted" | "converted" | "rejected";

export interface ApiSourcingRequest {
  id: string;
  customer: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  product_name: string;
  category: ProductType | "other";
  size_or_shoe: string;
  budget_max_xaf: string | null;
  reference_image: string | null;
  source_url: string;
  description: string;
  status: ApiSourcingStatus;
  quoted_price_xaf: string | null;
  admin_notes: string;
  converted_order: string | null;
  created_at: string;
}

export interface AdminDashboardSummary {
  total_revenue_xaf: number;
  total_collected_xaf: number;
  total_outstanding_xaf: number;
  orders_count: number;
  active_orders_count: number;
  pending_sourcing_count: number;
}

// ---- Espace vendeur ----

export type FulfillmentStatus = "pending" | "preparing" | "shipped";

export interface VendorProductVariantPayload {
  id?: string;
  sku: string;
  size: string;
  color: string;
  price_override_xaf?: number | null;
  stock_quantity: number;
}

export interface VendorProductPayload {
  name: string;
  slug: string;
  product_type: ProductType;
  brand: string;
  description: string;
  category: string;
  base_price_xaf: number;
  compare_at_price_xaf?: number | null;
  is_active: boolean;
  is_featured?: boolean;
  default_deposit_percentage: DepositPercentage;
  variants?: VendorProductVariantPayload[];
}

export interface ApiVendorOrderItem {
  id: string;
  order_id: string;
  order_number: string;
  order_created_at: string;
  customer_name: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_xaf: string;
  quantity: number;
  line_total_xaf: string;
  fulfillment_status: FulfillmentStatus;
  fulfillment_status_display: string;
}
