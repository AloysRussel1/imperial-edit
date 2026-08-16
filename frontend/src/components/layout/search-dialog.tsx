"use client";

import { type ReactNode, useState } from "react";
import { Search } from "lucide-react";

import { SearchAutocomplete } from "@/components/layout/search-autocomplete";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface SearchDialogProps {
  /** Permet à la barre de navigation inférieure de réutiliser ce même tiroir
   * de recherche sous l'apparence d'un item de nav (icône + libellé) plutôt
   * que le petit bouton icône par défaut du header. */
  trigger?: ReactNode;
}

export function SearchDialog({ trigger }: SearchDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label="Rechercher"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:text-imperial-gold"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <SheetHeader>
          <SheetTitle>Rechercher dans la collection</SheetTitle>
        </SheetHeader>
        <SearchAutocomplete onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
