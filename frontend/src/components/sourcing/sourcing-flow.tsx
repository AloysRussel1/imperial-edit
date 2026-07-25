"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { CheckCircle2, LogIn, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Price } from "@/components/common/price";
import { ImageDropzone } from "@/components/sourcing/image-dropzone";
import { submitSourcingRequest } from "@/lib/api";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { SOURCING_STATUS_META } from "@/lib/order-status";
import { useAuthStore } from "@/store/auth-store";
import { useSourcingStore } from "@/store/sourcing-store";
import type { ApiSourcingRequest, ProductType } from "@/types";

const CATEGORY_OPTIONS: (ProductType | "other")[] = ["bags", "shoes", "clothing", "perfumes", "watches", "other"];

export function SourcingFlow() {
  const user = useAuthStore((state) => state.user);
  const addRequest = useSourcingStore((state) => state.addRequest);

  const [submitted, setSubmitted] = useState<ApiSourcingRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<ProductType | "other">("bags");
  const [sizeOrShoe, setSizeOrShoe] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function resetForm() {
    setProductName("");
    setCategory("bags");
    setSizeOrShoe("");
    setBudgetMax("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitSourcingRequest({
        product_name: productName,
        category,
        size_or_shoe: sizeOrShoe,
        budget_max_xaf: budgetMax ? Number(budgetMax) : null,
        description,
        image: imageFile,
      });

      // Miroir local pour l'espace client (Étape précédente), le temps que le
      // tableau de bord lise directement l'API de sourcing.
      addRequest({
        id: result.id,
        created_at: result.created_at,
        customer_name: user ? `${user.first_name} ${user.last_name}`.trim() : "",
        contact: user?.whatsapp_number || user?.email || "",
        product_name: result.product_name,
        category: result.category,
        size_or_shoe: result.size_or_shoe,
        budget_max_xaf: result.budget_max_xaf ? Number(result.budget_max_xaf) : null,
        description: result.description,
        image_data_url: result.reference_image,
        status: "pending",
        quoted_price_xaf: null,
        admin_note: "",
      });

      setSubmitted(result);
      resetForm();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setError("Votre session a expiré, merci de vous reconnecter.");
      } else {
        setError("Impossible d'envoyer votre demande pour le moment. Réessayez dans un instant.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-8 text-center">
        <LogIn className="mx-auto h-8 w-8 text-imperial-gold" />
        <p className="text-imperial-black/70">
          Connectez-vous pour envoyer une demande de sourcing — nous associons chaque demande à votre compte
          pour vous transmettre le devis et suivre son avancement.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="gold">
            <Link href="/login?next=/sourcing">Se connecter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Créer un compte</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const statusMeta = SOURCING_STATUS_META.pending;
    return (
      <div className="space-y-6 rounded-lg border border-imperial-gold/30 bg-imperial-gold/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-imperial-gold" strokeWidth={1.5} />
        <div>
          <h3 className="font-display text-xl text-imperial-black">Demande envoyée avec succès</h3>
          <p className="mt-1 text-sm text-imperial-black/60">
            Référence <span className="font-medium text-imperial-black">#{submitted.id.slice(0, 8)}</span> —
            notre équipe l&apos;examine et reviendra vers vous avec un devis.
          </p>
        </div>

        <Badge variant={statusMeta.variant} className="mx-auto">
          {statusMeta.label}
        </Badge>

        <div className="mx-auto flex max-w-sm gap-4 rounded-lg border border-imperial-black/10 bg-white p-4 text-left">
          {submitted.reference_image ? (
            <Image
              src={submitted.reference_image}
              alt="Article recherché"
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-md object-cover"
            />
          ) : (
            <PlaceholderImage hue={40} className="h-20 w-20 shrink-0 rounded-md" iconClassName="h-6 w-6" />
          )}
          <div className="space-y-1 text-sm">
            <p className="font-medium text-imperial-black">
              {submitted.product_name || PRODUCT_TYPE_LABELS[submitted.category] || "Article recherché"}
            </p>
            <p className="text-imperial-black/50">
              {PRODUCT_TYPE_LABELS[submitted.category] ?? submitted.category}
              {submitted.size_or_shoe ? ` · ${submitted.size_or_shoe}` : ""}
            </p>
            {submitted.budget_max_xaf ? (
              <p className="text-imperial-black/50">
                Budget max : <Price amountXaf={Number(submitted.budget_max_xaf)} />
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="gold">
            <Link href="/dashboard">Suivre ma demande</Link>
          </Button>
          <Button variant="outline" onClick={() => setSubmitted(null)}>
            Nouvelle demande
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-imperial-black/10 bg-white p-6">
      <div className="space-y-1.5">
        <Label>Photo de l&apos;article recherché</Label>
        <ImageDropzone
          previewUrl={imagePreview}
          onChange={(file, preview) => {
            setImageFile(file);
            setImagePreview(preview);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sourcing-product-name">Nom du produit (si connu)</Label>
        <Input
          id="sourcing-product-name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Ex. Sac cabas mini"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sourcing-category">Catégorie</Label>
          <select
            id="sourcing-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductType | "other")}
            className="flex h-10 w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PRODUCT_TYPE_LABELS[option] ?? option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sourcing-size">Taille / pointure</Label>
          <Input
            id="sourcing-size"
            value={sizeOrShoe}
            onChange={(e) => setSizeOrShoe(e.target.value)}
            placeholder="Ex. 42 ou M"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sourcing-budget">Budget max (XAF)</Label>
          <Input
            id="sourcing-budget"
            type="number"
            min={0}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="Ex. 200000"
          />
          {budgetMax ? (
            <p className="text-xs text-imperial-black/45">
              ≈ <Price amountXaf={Number(budgetMax)} />
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sourcing-description">Description &amp; commentaires</Label>
        <textarea
          id="sourcing-description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Marque, modèle, couleur, contexte de la photo…"
          className="flex w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black placeholder:text-imperial-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <p className="text-xs text-imperial-black/50">
        Votre demande est transmise à notre équipe, qui l&apos;analyse et revient vers vous avec un devis sous
        48h.
      </p>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
        <Send className="mr-2 h-4 w-4" />
        {submitting ? "Envoi en cours…" : "Envoyer ma demande de sourcing"}
      </Button>
    </form>
  );
}
