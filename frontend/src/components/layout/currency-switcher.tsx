"use client";

import { Coins } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCurrencyStore } from "@/store/currency-store";
import type { Currency } from "@/types";

const OPTIONS: { value: Currency; label: string }[] = [
  { value: "XAF", label: "FCFA (XAF)" },
  { value: "EUR", label: "Euro (EUR)" },
];

export function CurrencySwitcher() {
  const currency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Choisir la devise d'affichage"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:text-imperial-gold"
        >
          <Coins className="h-4 w-4" />
          <span className="hidden sm:inline">{currency}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Devise</DropdownMenuLabel>
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => setCurrency(option.value)}
            className={cn(option.value === currency && "text-imperial-gold")}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
