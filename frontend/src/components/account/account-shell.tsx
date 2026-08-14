"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Package, PackageSearch, Search, Store, User } from "lucide-react";

import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { FavoritesContent } from "@/components/favorites/favorites-content";
import { ProfileTab } from "@/components/account/profile-tab";
import { VendorOrdersTab } from "@/components/vendor/vendor-orders-tab";
import { VendorProductsTab } from "@/components/vendor/vendor-products-tab";
import { VendorSourcingTab } from "@/components/vendor/vendor-sourcing-tab";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type TabId = "orders" | "profile" | "favorites" | "vendor-products" | "vendor-orders" | "vendor-sourcing";

const VENDOR_ONLY_TABS: TabId[] = ["vendor-products", "vendor-orders", "vendor-sourcing"];
const KNOWN_TABS: TabId[] = [
  "orders",
  "profile",
  "favorites",
  "vendor-products",
  "vendor-orders",
  "vendor-sourcing",
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
  { id: "vendor-products", label: "Catalogue Produits", icon: Store },
  { id: "vendor-orders", label: "Commandes à traiter", icon: Package },
  { id: "vendor-sourcing", label: "Demandes de sourcing", icon: Search },
];

// Droits cumulatifs (Admin = Client + Vendeur + Admin) : seul cet onglet
// vendeur est aussi ouvert à l'admin.
const ADMIN_CUMULATIVE_TABS: TabId[] = ["vendor-products"];

function isVendorOnlyTab(tab: string): tab is TabId {
  return (VENDOR_ONLY_TABS as string[]).includes(tab);
}

function canAccessTab(tab: TabId, role: string | undefined): boolean {
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

  const tabs = [
    ...BASE_TABS,
    ...VENDOR_TABS.filter((tab) => canAccessTab(tab.id, role)),
  ];

  function selectTab(tab: TabId) {
    setActive(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        {tabs.map((tab) => (
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
        ))}
      </nav>

      <div>
        {active === "orders" ? <CustomerDashboard /> : null}
        {active === "profile" ? <ProfileTab /> : null}
        {active === "favorites" ? <FavoritesContent /> : null}
        {/* Double garde, en plus de la redirection ci-dessus : ces composants
            ne sont jamais présents dans le DOM pour un rôle qui n'y a pas
            droit, même l'instant d'un rendu avant que l'effet ne corrige `active`. */}
        {active === "vendor-products" && canAccessTab("vendor-products", role) ? <VendorProductsTab /> : null}
        {active === "vendor-orders" && canAccessTab("vendor-orders", role) ? <VendorOrdersTab /> : null}
        {active === "vendor-sourcing" && canAccessTab("vendor-sourcing", role) ? <VendorSourcingTab /> : null}
      </div>
    </div>
  );
}
