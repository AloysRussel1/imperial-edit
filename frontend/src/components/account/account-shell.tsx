"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, Heart, Package, PackageSearch, Search, Store, User, Users } from "lucide-react";

import { AdminStaffTab } from "@/components/admin/admin-staff-tab";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { FavoritesContent } from "@/components/favorites/favorites-content";
import { ProfileTab } from "@/components/account/profile-tab";
import { VendorCashiersTab } from "@/components/vendor/vendor-cashiers-tab";
import { VendorOrdersTab } from "@/components/vendor/vendor-orders-tab";
import { VendorPosTab } from "@/components/vendor/vendor-pos-tab";
import { VendorProductsTab } from "@/components/vendor/vendor-products-tab";
import { VendorSourcingTab } from "@/components/vendor/vendor-sourcing-tab";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types";

type TabId =
  | "orders"
  | "profile"
  | "favorites"
  | "vendor-pos"
  | "vendor-products"
  | "vendor-orders"
  | "vendor-sourcing"
  | "vendor-cashiers"
  | "admin-staff";

// Table d'accès explicite, hiérarchie à 3 niveaux (ADMIN > VENDOR > CASHIER) :
// le caissier n'apparaît QUE sur "vendor-pos" — jamais sur les onglets client
// (orders/profile/favorites, qui supposent un compte acheteur) ni sur les
// onglets de gestion boutique (catalogue, commandes, sourcing, personnel).
// C'est la seule source de vérité pour qui voit/atteint quel onglet.
const TAB_ROLES: Record<TabId, UserRole[]> = {
  orders: ["customer", "vendor", "admin"],
  profile: ["customer", "vendor", "admin"],
  favorites: ["customer", "vendor", "admin"],
  "vendor-pos": ["cashier", "vendor", "admin"],
  "vendor-products": ["vendor", "admin"],
  "vendor-orders": ["vendor", "admin"],
  "vendor-sourcing": ["vendor", "admin"],
  "vendor-cashiers": ["vendor", "admin"],
  "admin-staff": ["admin"],
};

const KNOWN_TABS = Object.keys(TAB_ROLES) as TabId[];

const BASE_TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "orders", label: "Mes commandes & sourcing", icon: PackageSearch },
  { id: "profile", label: "Profil", icon: User },
  { id: "favorites", label: "Mes favoris", icon: Heart },
];

// "Gestion de ma Boutique" : ouvert au vendeur (propriétaire) en entier et,
// droits cumulatifs, à l'admin. "vendor-pos" y figure aussi car un caissier
// doit pouvoir l'atteindre — TAB_ROLES filtre le reste pour ce rôle.
const VENDOR_TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "vendor-pos", label: "Caisse", icon: CreditCard },
  { id: "vendor-products", label: "Catalogue Produits", icon: Store },
  { id: "vendor-orders", label: "Commandes à traiter", icon: Package },
  { id: "vendor-sourcing", label: "Demandes de sourcing", icon: Search },
  { id: "vendor-cashiers", label: "Mon Personnel / Caissiers", icon: Users },
];

// Section admin dédiée, distincte de "Gestion de ma Boutique".
const ADMIN_TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "admin-staff", label: "Gestion du personnel", icon: Users },
];

function canAccessTab(tab: TabId, role: string | undefined): boolean {
  // Caissier verrouillé : jamais rien d'autre que "Caisse", pas même un
  // repli sur les onglets client (il n'a pas d'identité acheteur).
  if (role === "cashier") return tab === "vendor-pos";
  // Visiteur non connecté (role encore inconnu, ex. avant hydratation ou
  // jamais authentifié) : traité comme un client potentiel pour les onglets
  // de base (chacun affiche son propre message "Connectez-vous", voir
  // CustomerDashboard/ProfileTab) — jamais pour les onglets de gestion
  // boutique/administration.
  if (!role) return TAB_ROLES[tab].includes("customer");
  return TAB_ROLES[tab].includes(role as UserRole);
}

export function AccountShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useAuthStore((state) => state._hasHydrated);
  const role = useAuthStore((state) => state.user?.role);

  const requestedTab = searchParams.get("tab");
  const [active, setActive] = useState<TabId>("orders");

  // Lit l'onglet demandé dans l'URL (ex. lien "Espace vendeur" du menu
  // compte) à chaque changement : un client qui tente `?tab=vendor-products`
  // sans être vendeur retombe silencieusement sur "profile", jamais un écran
  // vide ou une erreur — et l'URL elle-même est corrigée en conséquence.
  // Un caissier, lui, est verrouillé sur "vendor-pos" quel que soit le lien
  // suivi ou l'onglet précédemment actif — jamais de repli sur "profile"
  // (masqué pour ce rôle, voir TAB_ROLES) ni d'autre onglet de gestion
  // atteignable, même un instant.
  // Attend la réhydratation du store avant de trancher : sans ça, `role` vaut
  // encore `undefined` au tout premier rendu et un vrai vendeur se ferait
  // rediriger vers "profile" avant même que son rôle n'ait eu le temps de charger.
  useEffect(() => {
    if (!hydrated) return;

    if (role === "cashier") {
      if (requestedTab !== "vendor-pos") {
        router.replace("/dashboard?tab=vendor-pos", { scroll: false });
      }
      setActive("vendor-pos");
      return;
    }

    if (!requestedTab || !KNOWN_TABS.includes(requestedTab as TabId)) {
      return;
    }
    if (!canAccessTab(requestedTab as TabId, role)) {
      setActive("profile");
      router.replace("/dashboard?tab=profile", { scroll: false });
      return;
    }
    setActive(requestedTab as TabId);
  }, [hydrated, requestedTab, role, router]);

  const visibleBaseTabs = BASE_TABS.filter((tab) => canAccessTab(tab.id, role));
  const visibleVendorTabs = VENDOR_TABS.filter((tab) => canAccessTab(tab.id, role));
  const visibleAdminTabs = ADMIN_TABS.filter((tab) => canAccessTab(tab.id, role));

  function selectTab(tab: TabId) {
    setActive(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  }

  function renderTabButton(tab: { id: TabId; label: string; icon: typeof User }) {
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => selectTab(tab.id)}
        aria-pressed={active === tab.id}
        className={cn(
          "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2.5 text-sm transition-colors lg:w-full",
          active === tab.id
            ? "bg-imperial-black text-imperial-ivory"
            : "text-imperial-black/70 hover:bg-imperial-black/5"
        )}
      >
        <tab.icon className="h-4 w-4" strokeWidth={1.5} />
        {tab.label}
      </button>
    );
  }

  // Avant réhydratation, `role` n'est pas encore fiable : ne rien afficher
  // plutôt que de laisser un instant transparaître un onglet par défaut
  // ("Mes commandes") auquel un caissier n'a jamais droit.
  if (!hydrated) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
      <nav className="flex flex-col gap-4">
        {visibleBaseTabs.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">{visibleBaseTabs.map(renderTabButton)}</div>
        ) : null}

        {/* Regroupées et clairement identifiées sous le même intitulé que le
            lien "Gestion de ma Boutique" du menu compte, pour que l'espace
            vendeur soit reconnaissable comme un tout cohérent plutôt qu'une
            suite d'onglets mélangés à ceux du client. Pour un caissier, ne
            contient jamais que "Caisse" (TAB_ROLES filtre le reste). */}
        {visibleVendorTabs.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-imperial-black/10 pt-4 lg:pt-4">
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-widest2 text-imperial-black/40">
              Gestion de ma Boutique
            </p>
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
              {visibleVendorTabs.map(renderTabButton)}
            </div>
          </div>
        ) : null}

        {visibleAdminTabs.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-imperial-black/10 pt-4 lg:pt-4">
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-widest2 text-imperial-black/40">
              Administration
            </p>
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
              {visibleAdminTabs.map(renderTabButton)}
            </div>
          </div>
        ) : null}
      </nav>

      <div>
        {/* Double garde, en plus de la redirection ci-dessus : ces composants
            ne sont jamais présents dans le DOM pour un rôle qui n'y a pas
            droit, même l'instant d'un rendu avant que l'effet ne corrige `active`. */}
        {active === "orders" && canAccessTab("orders", role) ? <CustomerDashboard /> : null}
        {active === "profile" && canAccessTab("profile", role) ? <ProfileTab /> : null}
        {active === "favorites" && canAccessTab("favorites", role) ? <FavoritesContent /> : null}
        {active === "vendor-pos" && canAccessTab("vendor-pos", role) ? <VendorPosTab /> : null}
        {active === "vendor-products" && canAccessTab("vendor-products", role) ? <VendorProductsTab /> : null}
        {active === "vendor-orders" && canAccessTab("vendor-orders", role) ? <VendorOrdersTab /> : null}
        {active === "vendor-sourcing" && canAccessTab("vendor-sourcing", role) ? <VendorSourcingTab /> : null}
        {active === "vendor-cashiers" && canAccessTab("vendor-cashiers", role) ? <VendorCashiersTab /> : null}
        {active === "admin-staff" && canAccessTab("admin-staff", role) ? <AdminStaffTab /> : null}
      </div>
    </div>
  );
}
