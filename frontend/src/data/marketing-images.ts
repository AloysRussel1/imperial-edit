import type { ProductImage } from "@/types";

/** Photographies Unsplash (licence libre) utilisées pour les visuels éditoriaux
 * (hero, bannière sourcing) — indépendantes du catalogue produit, qui est
 * désormais alimenté par l'API Django. */

const UNSPLASH_PARAMS = "q=80&w=1600&auto=format&fit=crop";

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?${UNSPLASH_PARAMS}`;
}

export const HERO_IMAGE_URL = unsplash("photo-1758626756938-cbf9b936547b");

export interface HeroSlide {
  imageUrl: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

/** Slides du bandeau d'accueil (colonne centrale du Hero). */
export const HERO_SLIDES: HeroSlide[] = [
  {
    imageUrl: HERO_IMAGE_URL,
    eyebrow: "Maison de Sourcing & Haute Couture",
    title: "Le luxe européen, sourcé pour vous.",
    description:
      "De Paris à Milan en passant par Londres, nous sélectionnons et acheminons avec soin sacs, souliers, prêt-à-porter et parfums d'exception jusqu'au Cameroun.",
    ctaLabel: "Découvrir la Collection",
    ctaHref: "/products",
  },
  {
    imageUrl: unsplash("photo-1441984904996-e0b6ba687e04"),
    eyebrow: "Service sur-mesure",
    title: "Votre pièce rêvée, où qu'elle se trouve.",
    description:
      "Envoyez-nous une simple photo : notre équipe la localise, la négocie et vous la livre dans les mêmes conditions de confiance.",
    ctaLabel: "Faire une Demande de Sourcing",
    ctaHref: "/sourcing",
  },
];

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
