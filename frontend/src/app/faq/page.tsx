import type { Metadata } from "next";

import { Accordion } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "FAQ — Livraison & Paiement — The Imperial Collection",
  description: "Toutes les réponses sur la livraison France-Cameroun et les modes de paiement acceptés.",
};

const DELIVERY_FAQ = [
  {
    question: "Combien de temps prend la livraison entre la France et le Cameroun ?",
    answer:
      "Le délai moyen est de 10 à 21 jours ouvrés selon la disponibilité de l'article et la ville de livraison (Douala, Yaoundé et principales villes couvertes).",
  },
  {
    question: "Comment suivre ma commande ?",
    answer:
      "Un numéro de suivi vous est communiqué par WhatsApp dès l'expédition. Vous pouvez également suivre l'état de votre commande depuis votre espace client.",
  },
  {
    question: "Que se passe-t-il si l'article n'est plus disponible après ma commande ?",
    answer:
      "Nous vous proposons un article équivalent ou remboursons intégralement l'acompte versé, sans frais.",
  },
];

const PAYMENT_FAQ = [
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "Mobile Money (MTN Mobile Money, Orange Money) ainsi que les cartes bancaires Visa et Mastercard.",
  },
  {
    question: "Pourquoi un acompte de 50% ou 70% ?",
    answer:
      "L'acompte couvre l'achat et l'expédition de votre article depuis la France. Le taux (50% ou 70%) dépend du type d'article et de son coût de sourcing. Le solde est réglé à la livraison, contre remise de l'article.",
  },
  {
    question: "L'acompte est-il remboursable ?",
    answer:
      "Oui, en cas d'indisponibilité définitive de l'article ou d'annulation dans les 24h suivant la commande.",
  },
];

export default function FaqPage() {
  return (
    <main className="container py-16">
      <SectionHeading eyebrow="Besoin d'aide ?" title="Questions fréquentes" className="mb-14" />

      <div className="mx-auto max-w-2xl space-y-16">
        <div>
          <h2 className="mb-4 font-display text-2xl text-imperial-black">Livraison France ↔ Cameroun</h2>
          <Accordion items={DELIVERY_FAQ} />
        </div>

        <div id="paiement">
          <h2 className="mb-4 font-display text-2xl text-imperial-black">Paiement &amp; acompte</h2>
          <Accordion items={PAYMENT_FAQ} />
        </div>
      </div>
    </main>
  );
}
