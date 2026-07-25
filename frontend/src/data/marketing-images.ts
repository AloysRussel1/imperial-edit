import type { ProductImage } from "@/types";

/** Photographies Unsplash (licence libre) utilisées pour les visuels éditoriaux
 * (hero, bannière sourcing) — indépendantes du catalogue produit, qui est
 * désormais alimenté par l'API Django. */

const UNSPLASH_PARAMS = "q=80&w=1600&auto=format&fit=crop";

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?${UNSPLASH_PARAMS}`;
}

export const HERO_IMAGE_URL = unsplash("photo-1758626756938-cbf9b936547b");

export const SOURCING_BEFORE_IMAGE: ProductImage = {
  id: "sourcing-before",
  url: unsplash("photo-1522125670776-3c7abb882bc2"),
  alt: "Cliente envoyant une photo depuis son téléphone",
};

export const SOURCING_AFTER_IMAGE: ProductImage = {
  id: "sourcing-after",
  url: unsplash("photo-1566576721346-d4a3b4eaeb55"),
  alt: "Colis remis au client à la livraison",
};
