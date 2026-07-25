import type { Metadata } from "next";

import { SectionHeading } from "@/components/common/section-heading";
import { TrackingLookupForm } from "@/components/tracking/tracking-lookup-form";

export const metadata: Metadata = {
  title: "Suivi de colis — Imperial Collection",
  description: "Suivez l'avancement de votre commande Imperial Collection avec votre numéro de suivi.",
};

export default function TrackingPage() {
  return (
    <main className="container max-w-2xl py-16">
      <SectionHeading
        eyebrow="Sans connexion requise"
        title="Suivi de colis"
        description="Entrez votre numéro de suivi pour consulter l'avancement de votre commande en direct."
        className="mb-10"
      />
      <TrackingLookupForm />
    </main>
  );
}
