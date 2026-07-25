"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { CheckCircle2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { confirmPasswordReset } from "@/lib/api";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  if (!uid || !token) {
    return (
      <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">
          Ce lien de réinitialisation est incomplet ou invalide. Merci de refaire une demande.
        </p>
        <Link href="/forgot-password" className="text-sm text-imperial-gold underline underline-offset-4">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mismatch) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(uid as string, token as string, password);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const firstMessage = Object.values(err.response.data).flat()[0];
        setError(
          typeof firstMessage === "string"
            ? firstMessage
            : "Ce lien de réinitialisation est invalide ou a expiré."
        );
      } else {
        setError("Impossible de réinitialiser le mot de passe pour le moment.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 rounded-lg border border-imperial-gold/30 bg-imperial-gold/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-imperial-gold" strokeWidth={1.5} />
        <div>
          <h3 className="font-display text-lg text-imperial-black">Mot de passe mis à jour</h3>
          <p className="mt-1 text-sm text-imperial-black/60">
            Votre mot de passe a bien été changé. Vous pouvez désormais vous connecter avec vos nouveaux
            identifiants.
          </p>
        </div>
        <Button variant="gold" onClick={() => router.push("/login")}>
          Se connecter
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6">
      <div className="space-y-1.5">
        <Label htmlFor="reset-password">Nouveau mot de passe</Label>
        <PasswordInput
          id="reset-password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrengthMeter password={password} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reset-password-confirm">Confirmer le mot de passe</Label>
        <PasswordInput
          id="reset-password-confirm"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {mismatch ? <p className="text-xs text-red-700">Les mots de passe ne correspondent pas.</p> : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading || mismatch}>
        <KeyRound className="mr-2 h-4 w-4" />
        {loading ? "Mise à jour…" : "Réinitialiser le mot de passe"}
      </Button>
    </form>
  );
}
