"use client";

import Image from "next/image";
import { type DragEvent, type FormEvent, useEffect, useState } from "react";
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
import { VARIANT_AXIS_BY_TYPE } from "@/lib/variant-labels";
import { toast } from "@/store/toast-store";
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
    })) ?? []
  );
  const [quickSecondary, setQuickSecondary] = useState("");
  const [images, setImages] = useState(product?.images ?? []);
  // Création : les photos n'ont nulle part où être envoyées tant que le
  // produit n'existe pas côté backend (l'endpoint d'upload dépend de son
  // slug) — on les garde en mémoire ici et on les envoie juste après la
  // création, séquentiellement, avant de rendre la main à onSaved.
  const [stagedFiles, setStagedFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingStep, setSavingStep] = useState<"idle" | "product" | "photos">("idle");
  const [error, setError] = useState<string | null>(null);

  const axis = VARIANT_AXIS_BY_TYPE[productType];

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Le schéma de variantes (tailles/pointures/volumes…) dépend entièrement
  // de la catégorie : un changement de catégorie en cours de création rend
  // les déclinaisons déjà choisies incohérentes (ex. "38" en pointure de
  // chaussure n'a aucun sens une fois basculé sur "montres"). Uniquement en
  // création — on ne touche jamais aux variantes existantes d'un produit
  // déjà enregistré si son type est modifié en édition.
  useEffect(() => {
    if (!isEdit) setVariants([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType]);

  function updateVariant(index: number, patch: Partial<VendorProductVariantPayload>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { sku: "", size: "", color: "", stock_quantity: 0 }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function suggestSku(primaryValue: string): string {
    const base = slugify(name || productType).toUpperCase().replace(/-/g, "");
    return `${base || productType.toUpperCase()}-${primaryValue}`.toUpperCase().replace(/\s+/g, "");
  }

  /** Chip cliquée : crée la déclinaison (SKU suggéré, stock à 0, couleur
   * partagée du moment) si absente, ou retire toutes les déclinaisons
   * portant cette valeur si déjà active — bascule à un clic. */
  function toggleSizeChip(value: string) {
    setVariants((prev) => {
      const exists = prev.some((v) => v.size === value);
      if (exists) return prev.filter((v) => v.size !== value);
      return [...prev, { sku: suggestSku(value), size: value, color: quickSecondary, stock_quantity: 0 }];
    });
  }

  function updateChipStock(value: string, stock: number) {
    setVariants((prev) => prev.map((v) => (v.size === value ? { ...v, stock_quantity: stock } : v)));
  }

  async function handleImageUpload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    if (!product) {
      // Pas encore de produit créé : mise en attente locale uniquement.
      setStagedFiles((prev) => [...prev, ...list.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
      return;
    }

    setUploadingImage(true);
    let uploaded = 0;
    try {
      // Séquentiel plutôt que Promise.all : chaque upload attribue sa
      // `position` côté backend à partir de `product.images.count()` — des
      // requêtes concurrentes pourraient lire ce compte avant qu'il ne soit
      // à jour et produire deux photos à la même position.
      for (const file of list) {
        await uploadVendorProductImage(product.slug, file);
        setImages((prev) => [...prev, { id: `temp-${Date.now()}-${uploaded}`, url: URL.createObjectURL(file), alt: name }]);
        uploaded += 1;
      }
      toast.success(uploaded > 1 ? `${uploaded} photos ajoutées.` : "Photo ajoutée.");
    } catch {
      toast.error(
        uploaded > 0
          ? `${uploaded}/${list.length} photo(s) envoyée(s) — échec sur la suite.`
          : "Échec de l'upload de la photo."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingImage(false);
    if (event.dataTransfer.files.length) handleImageUpload(event.dataTransfer.files);
  }

  async function handleImageDelete(imageId: string) {
    if (!product) return;
    try {
      await deleteVendorProductImage(product.slug, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Photo supprimée.");
    } catch {
      toast.error("Échec de la suppression de la photo.");
    }
  }

  function removeStagedFile(previewUrl: string) {
    setStagedFiles((prev) => prev.filter((f) => f.previewUrl !== previewUrl));
    URL.revokeObjectURL(previewUrl);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    setSavingStep("product");
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

      if (!isEdit && stagedFiles.length > 0) {
        setSavingStep("photos");
        let photoFailures = 0;
        for (const { file } of stagedFiles) {
          try {
            await uploadVendorProductImage(saved.slug, file);
          } catch {
            photoFailures += 1;
          }
        }
        if (photoFailures > 0) {
          toast.error(`${photoFailures}/${stagedFiles.length} photo(s) non envoyée(s) — modifiez le produit pour réessayer.`);
        }
      }

      onSaved(saved);
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.status === 400
          ? "Vérifiez les champs — SKU déjà utilisé, catégorie manquante ou prix invalide."
          : "Impossible d'enregistrer ce produit pour le moment.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
      setSavingStep("idle");
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

      <div className="space-y-3 rounded-lg border border-imperial-black/10 p-4">
        <div>
          <Label>
            Déclinaisons rapides — {axis.primaryLabel.toLowerCase()} / {axis.secondaryLabel.toLowerCase()}
          </Label>
          <p className="mt-0.5 text-xs text-imperial-black/45">
            Cliquez sur une valeur pour créer la déclinaison, puis indiquez son stock.
          </p>
        </div>

        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="vp-quick-secondary" className="text-xs">
            {axis.secondaryLabel} (appliquée aux déclinaisons ajoutées ci-dessous)
          </Label>
          <Input
            id="vp-quick-secondary"
            placeholder={axis.secondaryPlaceholder}
            value={quickSecondary}
            onChange={(e) => setQuickSecondary(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {axis.primaryPresets.map((preset) => {
            const activeVariant = variants.find((v) => v.size === preset);
            if (!activeVariant) {
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => toggleSizeChip(preset)}
                  className="rounded-full border border-imperial-black/15 px-3.5 py-1.5 text-sm text-imperial-black/70 transition-colors hover:border-imperial-gold hover:text-imperial-black"
                >
                  {preset}
                </button>
              );
            }
            return (
              <div
                key={preset}
                className="flex items-center gap-1.5 rounded-full border border-imperial-gold bg-imperial-gold/10 py-1 pl-3.5 pr-1.5"
              >
                <span className="text-sm font-medium text-imperial-black">{preset}</span>
                <Input
                  type="number"
                  min={0}
                  aria-label={`Stock pour ${preset}`}
                  value={activeVariant.stock_quantity}
                  onChange={(e) => updateChipStock(preset, Number(e.target.value))}
                  className="h-7 w-16 border-imperial-gold/40 bg-white px-2 text-center text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleSizeChip(preset)}
                  aria-label={`Retirer ${preset}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-imperial-black/40 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-imperial-black/10 pt-3">
          <Label className="text-xs text-imperial-black/50">
            Déclinaison personnalisée (SKU, valeur ou {axis.secondaryLabel.toLowerCase()} spécifique)
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {/* Ne réaffiche pas ici les déclinaisons déjà représentées par une
              chip active ci-dessus (même valeur de {axis.primaryLabel}) —
              index d'origine conservé pour que update/remove ciblent la
              bonne entrée dans `variants`. */}
          {variants
            .map((variant, index) => ({ variant, index }))
            .filter(({ variant }) => !axis.primaryPresets.includes(variant.size))
            .map(({ variant, index }) => (
              <div key={index} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                <Input
                  placeholder="SKU"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder={axis.primaryPlaceholder}
                  title={axis.primaryLabel}
                  value={variant.size}
                  onChange={(e) => updateVariant(index, { size: e.target.value })}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder={axis.secondaryPlaceholder}
                  title={axis.secondaryLabel}
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
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-imperial-black/10 py-1.5 text-xs text-imperial-black/50 hover:border-red-300 hover:text-red-700 sm:col-span-1 sm:border-0 sm:py-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sm:hidden">Retirer</span>
                </button>
              </div>
            ))}
        </div>
      </div>

      <div>
        <Label>Photos</Label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingImage(true);
          }}
          onDragLeave={() => setIsDraggingImage(false)}
          onDrop={handleImageDrop}
          className={`mt-2 flex flex-wrap gap-3 rounded-lg border-2 border-dashed p-3 transition-colors ${
            isDraggingImage ? "border-imperial-gold bg-imperial-gold/5" : "border-transparent"
          }`}
        >
          {images.map((img) => (
            <div key={img.id} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-imperial-ivory">
              <Image src={img.url} alt={img.alt} fill sizes="80px" unoptimized className="object-cover" />
              <button
                type="button"
                onClick={() => handleImageDelete(img.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-imperial-black/60 opacity-100 transition-opacity hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Supprimer cette photo"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {/* Photos en attente d'envoi (création : pas encore de produit
              pour les recevoir) — retrait local, aucun appel API. */}
          {stagedFiles.map(({ file, previewUrl }) => (
            <div key={previewUrl} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-imperial-ivory">
              <Image src={previewUrl} alt={file.name} fill sizes="80px" unoptimized className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-imperial-black/60 py-0.5 text-center text-[0.6rem] text-imperial-ivory">
                en attente
              </span>
              <button
                type="button"
                onClick={() => removeStagedFile(previewUrl)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-imperial-black/60 opacity-100 transition-opacity hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Retirer cette photo"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-imperial-black/20 text-imperial-black/40 hover:border-imperial-gold hover:text-imperial-gold">
            {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="text-center text-[0.65rem] leading-tight">Glisser ou choisir</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingImage}
              onChange={(e) => {
                if (e.target.files?.length) handleImageUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-imperial-black/40">
          {isEdit
            ? "Glissez-déposez plusieurs photos ici, ou sélectionnez-en plusieurs à la fois depuis l'explorateur de fichiers."
            : "Ajoutez dès maintenant les photos du produit — elles seront envoyées automatiquement à la création."}
        </p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex justify-end gap-3 border-t border-imperial-black/10 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="gold" disabled={saving || !categoryId}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {savingStep === "photos" ? "Envoi des photos…" : isEdit ? "Enregistrer" : "Créer le produit"}
        </Button>
      </div>
    </form>
  );
}
