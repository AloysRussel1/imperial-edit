"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Package, PackageSearch, Store, User } from "lucide-react";

import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { FavoritesContent } from "@/components/favorites/favorites-content";
import { ProfileTab } from "@/components/account/profile-tab";
import { VendorOrdersTab } from "@/components/vendor/vendor-orders-tab";
import { VendorProductsTab } from "@/components/vendor/vendor-products-tab";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type TabId = "orders" | "profile" | "favorites" | "vendor-products" | "vendor-orders";

const VENDOR_ONLY_TABS: TabId[] = ["vendor-products", "vendor-orders"];
const KNOWN_TABS: TabId[] = ["orders", "profile", "favorites", "vendor-products", "vendor-orders"];

const BASE_TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "orders", label: "Mes commandes & sourcing", icon: PackageSearch },
  { id: "profile", label: "Profil", icon: User },
  { id: "favorites", label: "Mes favoris", icon: Heart },
];

// Réservé au rôle vendeur : un admin gère déjà l'ensemble du catalogue et de
// toutes les commandes via /admin-dashboard, plus complet — pas de doublon ici.
const VENDOR_TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "vendor-products", label: "Mes produits", icon: Store },
  { id: "vendor-orders", label: "Commandes à traiter", icon: Package },
];

function isVendorOnlyTab(tab: string): tab is TabId {
  return (VENDOR_ONLY_TABS as string[]).includes(tab);
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
    if (isVendorOnlyTab(requestedTab) && role !== "vendor") {
      setActive("profile");
      router.replace("/dashboard?tab=profile", { scroll: false });
      return;
    }
    setActive(requestedTab as TabId);
  }, [hydrated, requestedTab, role, router]);

  const tabs = role === "vendor" ? [...BASE_TABS, ...VENDOR_TABS] : BASE_TABS;

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
        {/* Double garde, en plus de la redirection ci-dessus : ces deux
            composants ne sont jamais présents dans le DOM pour un non-vendeur,
            même l'instant d'un rendu avant que l'effet ne corrige `active`. */}
        {active === "vendor-products" && role === "vendor" ? <VendorProductsTab /> : null}
        {active === "vendor-orders" && role === "vendor" ? <VendorOrdersTab /> : null}
      </div>
    </div>
  );
}
