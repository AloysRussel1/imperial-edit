import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutSuccessContent } from "@/components/checkout/checkout-success-content";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Commande confirmée — The Imperial Collection",
  description: "Votre commande a bien été enregistrée.",
};

export default function CheckoutSuccessPage() {
  return (
    <main className="container py-14">
      <SectionHeading eyebrow="Merci pour votre confiance" title="Commande confirmée" className="mb-10" />
      <Suspense fallback={null}>
        <CheckoutSuccessContent />
      </Suspense>
    </main>
  );
}
