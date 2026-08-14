import type { ProductType } from "@/types";

export interface VariantAxisConfig {
  /** Libellé + placeholder du 1er axe de variante (ex. taille, pointure, volume, diamètre). */
  primaryLabel: string;
  primaryPlaceholder: string;
  /** Libellé + placeholder du 2e axe (ex. couleur, concentration, matière). */
  secondaryLabel: string;
  secondaryPlaceholder: string;
  /** Une nuance de couleur réelle n'a de sens que pour sacs/vêtements/chaussures —
   * pour les autres catégories, le 2e axe est un texte libre (pas de pastille). */
  secondaryIsColor: boolean;
  /** Valeurs les plus fréquentes du 1er axe, proposées en chips à un clic —
   * une saisie manuelle reste toujours possible pour une valeur hors-liste. */
  primaryPresets: string[];
}

/**
 * Un seul couple de champs générique (taille/couleur) sert de support à toutes
 * les catégories côté données (`ProductVariant.size` / `.color`, aucune
 * migration nécessaire) — seuls le libellé et le placeholder changent pour
 * rester pertinents au vendeur ET au client qui consulte la fiche produit.
 */
export const VARIANT_AXIS_BY_TYPE: Record<ProductType, VariantAxisConfig> = {
  bags: {
    primaryLabel: "Taille",
    primaryPlaceholder: "Unique, Mini, GM…",
    secondaryLabel: "Couleur",
    secondaryPlaceholder: "Noir, Camel…",
    secondaryIsColor: true,
    primaryPresets: ["Unique", "Mini", "S", "M", "L", "XL"],
  },
  clothing: {
    primaryLabel: "Taille",
    primaryPlaceholder: "XS, S, M, L, XL…",
    secondaryLabel: "Couleur",
    secondaryPlaceholder: "Noir, Blanc…",
    secondaryIsColor: true,
    primaryPresets: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  shoes: {
    primaryLabel: "Pointure",
    primaryPlaceholder: "36, 37, 38…",
    secondaryLabel: "Couleur",
    secondaryPlaceholder: "Noir, Blanc…",
    secondaryIsColor: true,
    primaryPresets: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  },
  perfumes: {
    primaryLabel: "Volume",
    primaryPlaceholder: "50ml, 100ml…",
    secondaryLabel: "Concentration",
    secondaryPlaceholder: "Eau de Parfum, Eau de Toilette…",
    secondaryIsColor: false,
    primaryPresets: ["30ml", "50ml", "75ml", "100ml", "125ml"],
  },
  watches: {
    primaryLabel: "Diamètre",
    primaryPlaceholder: "38mm, 42mm…",
    secondaryLabel: "Matière",
    secondaryPlaceholder: "Acier, Or rose, Cuir…",
    secondaryIsColor: false,
    primaryPresets: ["36mm", "38mm", "40mm", "42mm", "44mm"],
  },
};
