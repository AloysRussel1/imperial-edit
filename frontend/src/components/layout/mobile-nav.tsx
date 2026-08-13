"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { CATALOG_PRODUCT_TYPES, NAV_LINKS, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { PRODUCT_TYPE_ICONS } from "@/lib/product-type-icons";

export function MobileNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("mobileNav.openMenu")}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
        >
          <Menu
            className={cn(
              "absolute h-5 w-5 transition-all duration-200",
              open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
            )}
          />
          <X
            className={cn(
              "absolute h-5 w-5 transition-all duration-200",
              open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
            )}
          />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-full max-w-xs flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>The Imperial Collection</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV_LINKS.map((link) =>
            "external" in link && link.external ? (
              <SheetClose asChild key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-2 py-3 text-base text-imperial-black transition-colors hover:bg-imperial-black/5 hover:text-imperial-gold"
                >
                  {t(link.labelKey)}
                </a>
              </SheetClose>
            ) : (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-2 py-3 text-base text-imperial-black transition-colors hover:bg-imperial-black/5 hover:text-imperial-gold"
                >
                  {t(link.labelKey)}
                </Link>
              </SheetClose>
            )
          )}

          <p className="mt-4 px-2 text-xs uppercase tracking-widest2 text-imperial-black/40">Catégories</p>
          {CATALOG_PRODUCT_TYPES.map((type) => {
            const Icon = PRODUCT_TYPE_ICONS[type];
            return (
              <SheetClose asChild key={type}>
                <Link
                  href={`/products?type=${type}`}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-sm text-imperial-black/80 transition-colors hover:bg-imperial-black/5 hover:text-imperial-gold"
                >
                  <Icon className="h-4 w-4 text-imperial-gold" strokeWidth={1.5} />
                  {PRODUCT_TYPE_LABELS[type]}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <div className="flex items-center justify-between gap-3 border-t border-imperial-black/10 pt-4 sm:hidden">
          <LanguageSwitcher />
          <CurrencySwitcher />
        </div>

        <div className="border-t border-imperial-black/10 pt-4">
          <WhatsAppButton>{t("mobileNav.whatsappCta")}</WhatsAppButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
