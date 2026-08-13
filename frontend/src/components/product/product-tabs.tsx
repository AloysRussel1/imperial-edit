"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { ProductDetail } from "@/types";

interface ProductTabsProps {
  product: ProductDetail;
}

type TabId = "description" | "specs" | "reviews";

const TABS: { id: TabId; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "specs", label: "Caractéristiques" },
  { id: "reviews", label: "Avis clients" },
];

export function ProductTabs({ product }: ProductTabsProps) {
  const [active, setActive] = useState<TabId>("description");

  return (
    <div className="mt-10">
      <div className="flex gap-6 border-b border-imperial-black/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-pressed={active === tab.id}
            className={cn(
              "relative -mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-imperial-gold text-imperial-black"
                : "border-transparent text-imperial-black/50 hover:text-imperial-black"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {active === "description" ? (
          <p className="max-w-2xl text-sm leading-relaxed text-imperial-black/70">{product.description}</p>
        ) : null}

        {active === "specs" ? (
          <dl className="grid max-w-lg grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between border-b border-imperial-black/5 pb-2">
              <dt className="text-imperial-black/50">Marque</dt>
              <dd className="text-imperial-black">{product.brand}</dd>
            </div>
            <div className="flex justify-between border-b border-imperial-black/5 pb-2">
              <dt className="text-imperial-black/50">Catégorie</dt>
              <dd className="text-imperial-black">{PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}</dd>
            </div>
            <div className="flex justify-between border-b border-imperial-black/5 pb-2">
              <dt className="text-imperial-black/50">Disponibilité</dt>
              <dd className="text-imperial-black">{product.availability.location}</dd>
            </div>
            <div className="flex justify-between border-b border-imperial-black/5 pb-2">
              <dt className="text-imperial-black/50">Acompte</dt>
              <dd className="text-imperial-black">{product.default_deposit_percentage}%</dd>
            </div>
          </dl>
        ) : null}

        {active === "reviews" ? (
          <p className="text-sm text-imperial-black/50">
            Aucun avis pour le moment — soyez le premier à partager votre expérience après réception de votre commande.
          </p>
        ) : null}
      </div>
    </div>
  );
}
