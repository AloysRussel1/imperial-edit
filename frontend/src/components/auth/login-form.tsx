"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuthStore } from "@/store/auth-store";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      // Sans destination explicite (`next`, ex. lien "Se connecter" depuis le
      // checkout) : l'admin est envoyé sur son espace complet (catalogue,
      // personnel, et — droits cumulatifs — la Caisse), le personnel de
      // caisse directement sur la Caisse (son seul vrai usage quotidien, pas
      // la peine de repasser par les onglets), le client sur son espace
      // "mes commandes" habituel.
      const role = useAuthStore.getState().user?.role;
      const defaultRedirect = role === "vendor" ? "/dashboard?tab=vendor-pos" : "/dashboard";
      const redirectTo = searchParams.get("next") ?? defaultRedirect;
      router.push(redirectTo);
    } catch {
      setError("Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
          type="text"
          inputMode="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Mot de passe</Label>
          <Link href="/forgot-password" className="text-xs text-imperial-gold underline underline-offset-4">
            Mot de passe oublié ?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        <LogIn className="mr-2 h-4 w-4" />
        {loading ? "Connexion…" : "Se connecter"}
      </Button>
      <p className="text-center text-sm text-imperial-black/60">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-imperial-gold underline underline-offset-4">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
