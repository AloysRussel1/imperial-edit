import Link from "next/link";
import { Gem } from "lucide-react";

import { AccountMenu } from "@/components/layout/account-menu";
import { CartSheet } from "@/components/layout/cart-sheet";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/layout/search-dialog";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-imperial-black/10 bg-imperial-ivory/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <MobileNav />
        </div>

        <Link href="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-imperial-gold" strokeWidth={1.5} />
          <span className="font-display text-lg tracking-wide text-imperial-black">The Imperial Edit</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm uppercase tracking-wide text-imperial-black/80 transition-colors hover:text-imperial-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <SearchDialog />
          <CurrencySwitcher />
          <CartSheet />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
