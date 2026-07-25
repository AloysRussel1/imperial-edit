"use client";

import { cn, formatPrice } from "@/lib/utils";
import { useCurrencyStore } from "@/store/currency-store";

interface PriceProps {
  amountXaf: number;
  className?: string;
}

export function Price({ amountXaf, className }: PriceProps) {
  const currency = useCurrencyStore((state) => state.currency);
  return <span className={cn(className)}>{formatPrice(amountXaf, currency)}</span>;
}
