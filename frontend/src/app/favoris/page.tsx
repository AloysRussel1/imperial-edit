import type { Metadata } from "next";

import { SectionHeading } from "@/components/common/section-heading";
import { FavoritesContent } from "@/components/favorites/favorites-content";

export const metadata: Metadata = {
  title: "Mes favoris — Imperial Collection",
  description: "Les pièces que vous avez mises de côté.",
};

export default function FavoritesPage() {
  return (
    <main className="container py-14">
      <SectionHeading
        align="left"
        eyebrow="Ma sélection"
        title="Mes favoris"
        description="Retrouvez ici les pièces que vous avez mises de côté."
        className="mb-12"
      />
      <FavoritesContent />
    </main>
  );
}
