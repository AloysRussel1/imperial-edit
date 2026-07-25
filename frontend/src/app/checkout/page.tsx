import type { Metadata } from "next";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Commande — The Imperial Collection",
  description: "Finalisez votre commande : livraison, acompte et paiement sécurisé.",
};

export default function CheckoutPage() {
  return (
    <main className="container py-14">
      <SectionHeading eyebrow="Tunnel de commande" title="Finaliser ma commande" className="mb-10" />
      <CheckoutFlow />
    </main>
  );
}
