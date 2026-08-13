"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELIVERY_LOCATIONS } from "@/lib/constants";
import { updateProfile } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export function ProfileTab() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp_number ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `user` n'est connu qu'après la réhydratation du store (persist), qui
  // arrive après le tout premier rendu : les champs doivent se resynchroniser
  // dès que le compte devient disponible, sinon ils restent figés à vide.
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone_number);
      setWhatsapp(user.whatsapp_number);
      setCity(user.city);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <p className="text-imperial-black/70">Connectez-vous pour gérer votre profil.</p>
        <Button asChild variant="gold">
          <Link href="/login?next=/dashboard">Se connecter</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        whatsapp_number: whatsapp,
        city,
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Impossible d'enregistrer vos informations pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6 rounded-lg border border-imperial-black/10 bg-white p-6">
      <div>
        <h2 className="font-display text-xl text-imperial-black">Mon profil</h2>
        <p className="mt-1 text-sm text-imperial-black/50">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-first-name">Prénom</Label>
          <Input id="profile-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-last-name">Nom</Label>
          <Input id="profile-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">Téléphone</Label>
          <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-whatsapp">WhatsApp</Label>
          <Input
            id="profile-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </div>
      </div>

      {/* Pas de carnet d'adresses multiple côté backend (un seul champ ville
          par compte) : l'adresse de livraison se saisit précisément à chaque
          commande, à l'étape 1 du checkout — ici, seule la ville par défaut. */}
      <div className="space-y-1.5">
        <Label htmlFor="profile-city">Ville de livraison habituelle</Label>
        <select
          id="profile-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex h-10 w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
        >
          <option value="">Non renseignée</option>
          {DELIVERY_LOCATIONS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Button type="submit" variant="gold" disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : null}
        {saved ? "Enregistré" : "Enregistrer"}
      </Button>
    </form>
  );
}
