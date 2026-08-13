"use client";

import { useState } from "react";
import { Heart, PackageSearch, User } from "lucide-react";

import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { FavoritesContent } from "@/components/favorites/favorites-content";
import { ProfileTab } from "@/components/account/profile-tab";
import { cn } from "@/lib/utils";

type TabId = "orders" | "profile" | "favorites";

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "orders", label: "Mes commandes & sourcing", icon: PackageSearch },
  { id: "profile", label: "Profil", icon: User },
  { id: "favorites", label: "Mes favoris", icon: Heart },
];

export function AccountShell() {
  const [active, setActive] = useState<TabId>("orders");

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
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
      </div>
    </div>
  );
}
