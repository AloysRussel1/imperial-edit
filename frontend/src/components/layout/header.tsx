"use client";

import Link from "next/link";
import { Gem } from "lucide-react";

import { AccountMenu } from "@/components/layout/account-menu";
import { CartSheet } from "@/components/layout/cart-sheet";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/layout/search-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-imperial-black/10 bg-imperial-ivory/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <MobileNav />
        </div>

        <Link href="/" className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
          <Gem className="h-5 w-5 shrink-0 text-imperial-gold" strokeWidth={1.5} />
          <span className="truncate font-display text-base tracking-wide text-imperial-black sm:text-lg">
            The Imperial Collection
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm uppercase tracking-wide text-imperial-black/80 transition-colors hover:text-imperial-gold"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="hidden items-center gap-0.5 sm:flex sm:gap-1">
            <SearchDialog />
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <CartSheet />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
