"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      // Le backend répond toujours de façon générique (compte existant ou non) —
      // on affiche donc systématiquement le même message de confirmation.
      setSubmitted(true);
    } catch {
      setError("Impossible d'envoyer la demande pour le moment. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 rounded-lg border border-imperial-gold/30 bg-imperial-gold/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-imperial-gold" strokeWidth={1.5} />
        <div>
          <h3 className="font-display text-lg text-imperial-black">E-mail envoyé</h3>
          <p className="mt-1 text-sm text-imperial-black/60">
            Si un compte existe avec l&apos;adresse <span className="font-medium text-imperial-black">{email}</span>,
            un lien de réinitialisation vient de lui être envoyé. Pensez à vérifier vos courriers indésirables.
          </p>
        </div>
        <Link href="/login" className="text-sm text-imperial-gold underline underline-offset-4">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6">
      <p className="text-sm text-imperial-black/60">
        Indiquez l&apos;adresse e-mail de votre compte — nous vous enverrons un lien pour choisir un nouveau mot de
        passe.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">E-mail</Label>
        <Input
          id="forgot-email"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        <Mail className="mr-2 h-4 w-4" />
        {loading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
      </Button>
      <p className="text-center text-sm text-imperial-black/60">
        <Link href="/login" className="text-imperial-gold underline underline-offset-4">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
