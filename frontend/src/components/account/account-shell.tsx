"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, Heart, Package, PackageSearch, Search, Store, User, Users } from "lucide-react";

import { AdminStaffTab } from "@/components/admin/admin-staff-tab";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { FavoritesContent } from "@/components/favorites/favorites-content";
import { ProfileTab } from "@/components/account/profile-tab";
import { VendorOrdersTab } from "@/components/vendor/vendor-orders-tab";
import { VendorPosTab } from "@/components/vendor/vendor-pos-tab";
import { VendorProductsTab } from "@/components/vendor/vendor-products-tab";
import { VendorSourcingTab } from "@/components/vendor/vendor-sourcing-tab";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type TabId =
  | "orders"
  | "profile"
  | "favorites"
  | "vendor-pos"
  | "vendor-products"
  | "vendor-orders"
  | "vendor-sourcing"
  | "admin-staff";

const VENDOR_ONLY_TABS: TabId[] = ["vendor-pos", "vendor-products", "vendor-orders", "vendor-sourcing"];
// Jamais cumulatif au vendeur, contrairement à VENDOR_ONLY_TABS : créer des
// comptes caissier·e reste un pouvoir strictement réservé à la propriétaire.
const ADMIN_ONLY_TABS: TabId[] = ["admin-staff"];
const KNOWN_TABS: TabId[] = [
  "orders",
  "profile",
  "favorites",
  "vendor-pos",
  "vendor-products",
  "vendor-orders",
  "vendor-sourcing",
  "admin-staff",
];

const BASE_TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "orders", label: "Mes commandes & sourcing", icon: PackageSearch },
  { id: "profile", label: "Profil", icon: User },
  { id: "favorites", label: "Mes favoris", icon: Heart },
];

// Réservés au vendeur. "vendor-products" fait exception (voir
// ADMIN_CUMULATIVE_TABS) : un admin a aussi accès à la gestion du catalogue
// depuis son propre menu ("Gestion de ma Boutique"), mais gère commandes et
// sourcing via la vue plus complète d'/admin-dashboard (états résolus déjà
// gérés là-bas, pas de doublon incomplet ici).
const VENDOR_TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "vendor-pos", label: "Caisse", icon: CreditCard },
  { id: "vendor-products", label: "Catalogue Produits", icon: Store },
  { id: "vendor-orders", label: "Commandes à traiter", icon: Package },
  { id: "vendor-sourcing", label: "Demandes de sourcing", icon: Search },
];

// Droits cumulatifs (Admin = Client + Vendeur + Admin) : la Caisse et le
// catalogue restent aussi ouverts à l'admin (la propriétaire peut elle-même
// tenir le comptoir) ; commandes et sourcing restent gérées via la vue plus
// complète d'/admin-dashboard.
const ADMIN_CUMULATIVE_TABS: TabId[] = ["vendor-pos", "vendor-products"];

// Section admin dédiée, distincte de "Gestion de ma Boutique" (qui reste le
// regroupement des onglets vendeur, cumulatifs ou non pour l'admin).
const ADMIN_TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "admin-staff", label: "Gestion du personnel", icon: Users },
];

function isVendorOnlyTab(tab: string): tab is TabId {
  return (VENDOR_ONLY_TABS as string[]).includes(tab);
}

function isAdminOnlyTab(tab: string): tab is TabId {
  return (ADMIN_ONLY_TABS as string[]).includes(tab);
}

function canAccessTab(tab: TabId, role: string | undefined): boolean {
  if (isAdminOnlyTab(tab)) return role === "admin";
  if (!isVendorOnlyTab(tab)) return true;
  if (role === "vendor") return true;
  return role === "admin" && ADMIN_CUMULATIVE_TABS.includes(tab);
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
  // Attend la réhydratation du store avant de trancher : sans ça, `role` vaut
  // encore `undefined` au tout premier rendu et un vrai vendeur se ferait
  // rediriger vers "profile" avant même que son rôle n'ait eu le temps de charger.
  useEffect(() => {
    if (!hydrated || !requestedTab || !KNOWN_TABS.includes(requestedTab as TabId)) {
      return;
    }
    if (!canAccessTab(requestedTab as TabId, role)) {
      setActive("profile");
      router.replace("/dashboard?tab=profile", { scroll: false });
      return;
    }
    setActive(requestedTab as TabId);
  }, [hydrated, requestedTab, role, router]);

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

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
      <nav className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">{BASE_TABS.map(renderTabButton)}</div>

        {/* Regroupées et clairement identifiées sous le même intitulé que le
            lien "Gestion de ma Boutique" du menu compte, pour que l'espace
            vendeur soit reconnaissable comme un tout cohérent plutôt qu'une
            suite d'onglets mélangés à ceux du client. */}
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
        {active === "orders" ? <CustomerDashboard /> : null}
        {active === "profile" ? <ProfileTab /> : null}
        {active === "favorites" ? <FavoritesContent /> : null}
        {/* Double garde, en plus de la redirection ci-dessus : ces composants
            ne sont jamais présents dans le DOM pour un rôle qui n'y a pas
            droit, même l'instant d'un rendu avant que l'effet ne corrige `active`. */}
        {active === "vendor-pos" && canAccessTab("vendor-pos", role) ? <VendorPosTab /> : null}
        {active === "vendor-products" && canAccessTab("vendor-products", role) ? <VendorProductsTab /> : null}
        {active === "vendor-orders" && canAccessTab("vendor-orders", role) ? <VendorOrdersTab /> : null}
        {active === "vendor-sourcing" && canAccessTab("vendor-sourcing", role) ? <VendorSourcingTab /> : null}
        {active === "admin-staff" && canAccessTab("admin-staff", role) ? <AdminStaffTab /> : null}
      </div>
    </div>
  );
}
