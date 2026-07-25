"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { NAV_LINKS } from "@/lib/constants";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>The Imperial Edit</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-2 py-3 text-base text-imperial-black transition-colors hover:bg-imperial-black/5 hover:text-imperial-gold"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="border-t border-imperial-black/10 pt-4">
          <WhatsAppButton>Une question ? Écrivez-nous sur WhatsApp</WhatsAppButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
