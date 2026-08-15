"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { useAuthStore } from "@/store/auth-store";

export function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mismatch) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        whatsapp_number: whatsapp,
        city,
      });
      // Le compte reste inactif tant que le code reçu par e-mail n'a pas été
      // saisi (voir VerifyEmailForm) — pas de session ouverte ici.
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const firstMessage = Object.values(err.response.data).flat()[0];
        setError(typeof firstMessage === "string" ? firstMessage : "Inscription impossible, vérifiez vos informations.");
      } else {
        setError("Inscription impossible pour le moment.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="register-first-name">Prénom</Label>
          <Input id="register-first-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="register-last-name">Nom</Label>
          <Input id="register-last-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-email">E-mail</Label>
        <Input
          id="register-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="register-whatsapp">Numéro WhatsApp</Label>
          <Input
            id="register-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="register-city">Ville</Label>
          <Input id="register-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Douala" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-password">Mot de passe</Label>
        <PasswordInput
          id="register-password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrengthMeter password={password} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-password-confirm">Confirmer le mot de passe</Label>
        <PasswordInput
          id="register-password-confirm"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {mismatch ? <p className="text-xs text-red-700">Les mots de passe ne correspondent pas.</p> : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading || mismatch}>
        <UserPlus className="mr-2 h-4 w-4" />
        {loading ? "Création du compte…" : "Créer mon compte"}
      </Button>
      <p className="text-center text-sm text-imperial-black/60">
        Déjà client ?{" "}
        <Link href="/login" className="text-imperial-gold underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
