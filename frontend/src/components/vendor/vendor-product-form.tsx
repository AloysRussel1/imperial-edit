"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createVendorProduct,
  deleteVendorProductImage,
  fetchCategories,
  updateVendorProduct,
  uploadVendorProductImage,
} from "@/lib/api";
import { CATALOG_PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { ProductCategory, ProductDetail, ProductType, VendorProductVariantPayload } from "@/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // accents, apres decomposition NFD (echappement Unicode explicite, sans caractere combinant brut)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface VendorProductFormProps {
  product: ProductDetail | null;
  onSaved: (product: ProductDetail) => void;
  onCancel: () => void;
}

export function VendorProductForm({ product, onSaved, onCancel }: VendorProductFormProps) {
  const isEdit = product !== null;

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [productType, setProductType] = useState<ProductType>(product?.product_type ?? "bags");
  const [categoryId, setCategoryId] = useState(product?.category.id ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(String(product?.base_price_xaf ?? ""));
  const [comparePrice, setComparePrice] = useState(
    product?.compare_at_price_xaf ? String(product.compare_at_price_xaf) : ""
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [depositPct, setDepositPct] = useState<50 | 70>(product?.default_deposit_percentage ?? 50);
  const [variants, setVariants] = useState<VendorProductVariantPayload[]>(
    product?.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      price_override_xaf: v.price_override_xaf,
      stock_quantity: v.stock_quantity,
    })) ?? [{ sku: "", size: "Unique", color: "", stock_quantity: 0 }]
  );
  const [images, setImages] = useState(product?.images ?? []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  function updateVariant(index: number, patch: Partial<VendorProductVariantPayload>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { sku: "", size: "", color: "", stock_quantity: 0 }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(file: File) {
    if (!product) return;
    setUploadingImage(true);
    try {
      await uploadVendorProductImage(product.slug, file);
      setImages((prev) => [...prev, { id: `temp-${Date.now()}`, url: URL.createObjectURL(file), alt: name }]);
    } catch {
      setError("Échec de l'upload de la photo.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleImageDelete(imageId: string) {
    if (!product) return;
    try {
      await deleteVendorProductImage(product.slug, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Échec de la suppression de la photo.");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        product_type: productType,
        brand,
        description,
        category: categoryId,
        base_price_xaf: Number(basePrice),
        compare_at_price_xaf: comparePrice ? Number(comparePrice) : null,
        is_active: isActive,
        default_deposit_percentage: depositPct,
        variants: variants.filter((v) => v.sku.trim() && v.size.trim()),
      };
      const saved = isEdit ? await updateVendorProduct(product.slug, payload) : await createVendorProduct(payload);
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof AxiosError && err.response?.status === 400
          ? "Vérifiez les champs — SKU déjà utilisé, catégorie manquante ou prix invalide."
          : "Impossible d'enregistrer ce produit pour le moment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="vp-name">Nom du produit</Label>
          <Input id="vp-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vp-slug">Slug (URL)</Label>
          <Input
            id="vp-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="vp-type">Catégorie de produit</Label>
          <select
            id="vp-type"
            value={productType}
            onChange={(e) => setProductType(e.target.value as ProductType)}
            className="flex h-10 w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
          >
            {CATALOG_PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PRODUCT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vp-category">Rayon (catalogue)</Label>
          <select
            id="vp-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
          >
            <option value="">Sélectionner…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vp-brand">Marque</Label>
        <Input id="vp-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vp-description">Description</Label>
        <textarea
          id="vp-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="flex w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="vp-price">Prix (XAF)</Label>
          <Input id="vp-price" type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vp-compare-price">Prix barré (optionnel)</Label>
          <Input id="vp-compare-price" type="number" min={0} value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vp-deposit">Acompte</Label>
          <select
            id="vp-deposit"
            value={depositPct}
            onChange={(e) => setDepositPct(Number(e.target.value) as 50 | 70)}
            className="flex h-10 w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
          >
            <option value={50}>50%</option>
            <option value={70}>70%</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-imperial-black/70">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-imperial-gold" />
        Visible sur la boutique
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Variantes (taille / couleur / stock)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2">
              <Input
                placeholder="SKU"
                value={variant.sku}
                onChange={(e) => updateVariant(index, { sku: e.target.value })}
                className="h-9 text-sm"
              />
              <Input
                placeholder="Taille"
                value={variant.size}
                onChange={(e) => updateVariant(index, { size: e.target.value })}
                className="h-9 text-sm"
              />
              <Input
                placeholder="Couleur"
                value={variant.color}
                onChange={(e) => updateVariant(index, { color: e.target.value })}
                className="h-9 text-sm"
              />
              <Input
                type="number"
                min={0}
                placeholder="Stock"
                value={variant.stock_quantity}
                onChange={(e) => updateVariant(index, { stock_quantity: Number(e.target.value) })}
                className="h-9 text-sm"
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                aria-label="Retirer cette variante"
                className="text-imperial-black/40 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {isEdit ? (
        <div>
          <Label>Photos</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.id} className="group relative h-20 w-20 overflow-hidden rounded-md bg-imperial-ivory">
                <Image src={img.url} alt={img.alt} fill sizes="80px" unoptimized className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleImageDelete(img.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-imperial-black/60 opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100"
                  aria-label="Supprimer cette photo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-imperial-black/20 text-imperial-black/40 hover:border-imperial-gold hover:text-imperial-gold">
              {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="text-[0.65rem]">Ajouter</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        <p className="text-xs text-imperial-black/45">
          Enregistrez le produit pour pouvoir y ajouter des photos.
        </p>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex justify-end gap-3 border-t border-imperial-black/10 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="gold" disabled={saving || !categoryId}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEdit ? "Enregistrer" : "Créer le produit"}
        </Button>
      </div>
    </form>
  );
}
