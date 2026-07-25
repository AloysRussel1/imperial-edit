"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrackingLookupForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/tracking/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-imperial-black/10 bg-white p-6 sm:p-8"
    >
      <div className="space-y-1.5">
        <Label htmlFor="tracking-code">Numéro de suivi</Label>
        <Input
          id="tracking-code"
          required
          placeholder="Ex. IC-2026-X89B"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="text-center font-medium tracking-wide"
        />
        <p className="text-xs text-imperial-black/45">
          Ce code vous a été communiqué par e-mail ou WhatsApp à la confirmation de votre commande.
        </p>
      </div>
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={!code.trim()}>
        <PackageSearch className="mr-2 h-4 w-4" />
        Suivre mon colis
      </Button>
    </form>
  );
}
