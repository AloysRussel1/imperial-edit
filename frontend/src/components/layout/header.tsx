"use client";

import Link from "next/link";
import { Gem } from "lucide-react";

import { AccountMenu } from "@/components/layout/account-menu";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CartSheet } from "@/components/layout/cart-sheet";
import { CategoryMenu } from "@/components/layout/category-menu";
import { FavoritesButton } from "@/components/layout/favorites-button";
import { HeaderSearchBar } from "@/components/layout/header-search-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/layout/search-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const { t } = useTranslation();

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-50 border-b border-imperial-black/10 bg-imperial-ivory/95 backdrop-blur">
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

          <HeaderSearchBar />

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="flex items-center gap-0.5 sm:gap-1 lg:hidden">
              <SearchDialog />
            </div>
            <FavoritesButton />
            <CartSheet />
            <AccountMenu />
          </div>
        </div>

        {/* Barre de navigation secondaire : accès catégories + liens directs. */}
        <div className="border-t border-imperial-black/5">
          <div className="container flex h-12 items-center gap-6">
            <div className="hidden shrink-0 md:block">
              <CategoryMenu />
            </div>
            <nav className="hidden items-center gap-6 overflow-x-auto md:flex lg:gap-8">
              {NAV_LINKS.map((link) =>
                "external" in link && link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap text-sm uppercase tracking-wide text-imperial-black/80 transition-colors hover:text-imperial-gold"
                  >
                    {t(link.labelKey)}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="whitespace-nowrap text-sm uppercase tracking-wide text-imperial-black/80 transition-colors hover:text-imperial-gold"
                  >
                    {t(link.labelKey)}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
