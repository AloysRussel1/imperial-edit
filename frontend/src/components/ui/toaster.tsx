"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "flex items-start gap-2.5 rounded-lg border bg-white p-3.5 shadow-lg",
            t.variant === "success" ? "border-emerald-800/20" : "border-red-800/20"
          )}
        >
          {t.variant === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
          )}
          <p className="flex-1 text-sm text-imperial-black">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Fermer"
            className="text-imperial-black/30 hover:text-imperial-black/60"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
