/** Libellés lisibles pour les champs les plus courants renvoyés par les
 * erreurs de validation DRF — retombe sur le nom brut du champ si absent. */
const FIELD_LABELS: Record<string, string> = {
  name: "Nom",
  slug: "Slug",
  category: "Catégorie",
  product_type: "Catégorie de produit",
  base_price_xaf: "Prix",
  compare_at_price_xaf: "Prix barré",
  default_deposit_percentage: "Acompte",
  variants: "Variantes",
  sku: "SKU",
  size: "Taille/Pointure/Volume",
  color: "Couleur",
  stock_quantity: "Stock",
  non_field_errors: "",
  detail: "",
};

/**
 * Aplati une réponse d'erreur DRF (objet imbriqué de chaînes/listes/objets,
 * ex. `{"variants": [{}, {"sku": ["Un objet product variant avec ce champ
 * sku existe déjà."]}]}`) en messages lisibles, préfixés par le champ
 * concerné — plutôt qu'une phrase générique qui masque le vrai problème.
 */
export function flattenApiErrors(data: unknown, prefix = ""): string[] {
  if (typeof data === "string") {
    return [prefix ? `${prefix} : ${data}` : data];
  }

  if (Array.isArray(data)) {
    return data.flatMap((item, index) => {
      if (typeof item === "string") {
        return [prefix ? `${prefix} : ${item}` : item];
      }
      if (item && typeof item === "object" && Object.keys(item).length > 0) {
        const itemPrefix = prefix ? `${prefix} #${index + 1}` : `#${index + 1}`;
        return flattenApiErrors(item, itemPrefix);
      }
      return [];
    });
  }

  if (data && typeof data === "object") {
    return Object.entries(data).flatMap(([key, value]) => {
      const label = FIELD_LABELS[key] ?? key;
      const nextPrefix = prefix ? (label ? `${prefix} — ${label}` : prefix) : label;
      return flattenApiErrors(value, nextPrefix);
    });
  }

  return [];
}

/** Message d'erreur prêt à afficher à partir d'une réponse Axios/DRF 400 —
 * les détails exacts (champ par champ) plutôt qu'une phrase générique. */
export function describeApiError(responseData: unknown, fallback: string): string {
  const details = flattenApiErrors(responseData);
  return details.length > 0 ? details.join(" · ") : fallback;
}
