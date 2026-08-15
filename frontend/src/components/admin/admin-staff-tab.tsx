"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { createStaffAccount, fetchStaffAccounts } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { ApiStaffUser } from "@/types";

export function AdminStaffTab() {
  const [staff, setStaff] = useState<ApiStaffUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setStaff(await fetchStaffAccounts());
    } catch {
      setLoadError("Impossible de charger la liste du personnel pour le moment.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createStaffAccount({ email, password, first_name: firstName, last_name: lastName });
      toast.success(`Compte caissier·e créé pour ${email}.`);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const firstMessage = Object.values(err.response.data).flat()[0];
        setError(typeof firstMessage === "string" ? firstMessage : "Création du compte impossible.");
      } else {
        setError("Création du compte impossible pour le moment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-imperial-black">Gestion du personnel</h2>
        <p className="mt-1 text-sm text-imperial-black/50">
          Créez les comptes caissier·e / vendeur·se de la boutique de Yaoundé — accès à la Caisse et au catalogue en
          lecture seule.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="staff-first-name">Prénom</Label>
            <Input id="staff-first-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-last-name">Nom</Label>
            <Input id="staff-last-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-email">E-mail</Label>
          <Input
            id="staff-email"
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-password">Mot de passe</Label>
          <PasswordInput
            id="staff-password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordStrengthMeter password={password} />
        </div>
        <div className="space-y-1.5">
          <Label>Rôle</Label>
          <div>
            <Badge variant="outline">Caissier·e / Vendeur·se</Badge>
          </div>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
          <UserPlus className="mr-2 h-4 w-4" />
          {submitting ? "Création…" : "Créer le compte"}
        </Button>
      </form>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-display text-base text-imperial-black">
          <Users className="h-4 w-4" /> Personnel actuel
        </h3>
        {loadError ? (
          <p className="text-sm text-red-700">{loadError}</p>
        ) : staff === null ? (
          <div className="flex items-center gap-2 py-6 text-imperial-black/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        ) : staff.length === 0 ? (
          <p className="rounded-lg border border-dashed border-imperial-black/15 py-10 text-center text-sm text-imperial-black/45">
            Aucun compte caissier·e pour le moment.
          </p>
        ) : (
          <div className="w-full max-w-full overflow-x-auto rounded-xl border border-imperial-black/10 bg-white">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-imperial-black/10 text-xs uppercase tracking-wide text-imperial-black/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Créé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-imperial-black/5">
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-imperial-black">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="px-4 py-3 text-imperial-black/70">{member.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={member.is_active ? "success" : "outline"}>
                        {member.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-imperial-black/60">
                      {new Date(member.date_joined).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
