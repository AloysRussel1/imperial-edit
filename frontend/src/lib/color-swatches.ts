/**
 * Correspondance nom de couleur (texte libre saisi côté back-office) → teinte
 * approximative, pour un rendu visuel en pastille plutôt qu'un simple label.
 * Purement décoratif : la donnée réelle reste le nom texte (`variant.color`),
 * jamais remplacé — un nom non couvert retombe sur un pourtour neutre plutôt
 * que d'inventer une couleur.
 */
const COLOR_HEX: Record<string, string> = {
  rouge: "#8c1f28",
  cognac: "#a85c32",
  noir: "#0b0b0c",
  blanc: "#f5f5f0",
  "noir/blanc": "#0b0b0c",
  or: "#c9a24b",
  doré: "#c9a24b",
  argent: "#c7c9cc",
  bleu: "#1f3a5f",
  marine: "#12233d",
  vert: "#2f4a3c",
  beige: "#d9c7a3",
  gris: "#6b6b6b",
  camel: "#b98858",
  bordeaux: "#5c1a24",
  rose: "#d9a0a6",
  ambre: "#b3752c",
  multicolore: "conic-gradient(#c9a24b, #8c1f28, #1f3a5f, #2f4a3c, #c9a24b)",
  unique: "#c9a24b",
};

export function colorToSwatch(colorName: string): string | null {
  return COLOR_HEX[colorName.trim().toLowerCase()] ?? null;
}
