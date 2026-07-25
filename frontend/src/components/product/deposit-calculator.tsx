"use client";

import { Price } from "@/components/common/price";
import { DEPOSIT_PERCENTAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DepositPercentage } from "@/types";

interface DepositCalculatorProps {
  totalXaf: number;
  depositPercentage: DepositPercentage;
  onChangeDepositPercentage: (percentage: DepositPercentage) => void;
}

export function DepositCalculator({
  totalXaf,
  depositPercentage,
  onChangeDepositPercentage,
}: DepositCalculatorProps) {
  const depositXaf = Math.round((totalXaf * depositPercentage) / 100);
  const remainingXaf = totalXaf - depositXaf;

  return (
    <div className="rounded-lg border border-imperial-gold/30 bg-imperial-gold/5 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-imperial-black">Module d&apos;acompte</p>
        <div className="flex gap-1.5">
          {DEPOSIT_PERCENTAGES.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => onChangeDepositPercentage(pct)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                depositPercentage === pct
                  ? "border-imperial-gold bg-imperial-gold text-imperial-black"
                  : "border-imperial-black/15 text-imperial-black/60 hover:border-imperial-gold"
              )}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-imperial-black/60">Prix total</dt>
          <dd className="font-medium text-imperial-black">
            <Price amountXaf={totalXaf} />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-imperial-black/60">Acompte à régler aujourd&apos;hui ({depositPercentage}%)</dt>
          <dd className="font-semibold text-imperial-gold">
            <Price amountXaf={depositXaf} />
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-imperial-black/10 pt-2">
          <dt className="text-imperial-black/60">Solde dû à la livraison</dt>
          <dd className="font-medium text-imperial-black">
            <Price amountXaf={remainingXaf} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
