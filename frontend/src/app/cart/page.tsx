import type { Metadata } from "next";

import { SectionHeading } from "@/components/common/section-heading";
import { CartPageContent } from "@/components/cart/cart-page-content";

export const metadata: Metadata = {
  title: "Votre panier — Imperial Collection",
  description: "Articles sélectionnés avant de passer commande.",
};

export default function CartPage() {
  return (
    <main className="container py-14">
      <SectionHeading align="left" eyebrow="Étape 1" title="Votre panier" className="mb-10" />
      <CartPageContent />
    </main>
  );
}
