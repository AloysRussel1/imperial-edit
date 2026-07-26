import type { Metadata } from "next";

import { SectionHeading } from "@/components/common/section-heading";
import { VendorDashboard } from "@/components/vendor/vendor-dashboard";

export const metadata: Metadata = {
  title: "Mes produits — The Imperial Collection",
  description: "Gestion du catalogue rattaché à votre compte vendeur.",
};

export default function VendorDashboardPage() {
  return (
    <main className="container py-14">
      <SectionHeading
        align="left"
        eyebrow="Espace vendeur"
        title="Mes produits"
        description="Catalogue rattaché à votre compte : nom, prix, stock et statut."
        className="mb-12"
      />
      <VendorDashboard />
    </main>
  );
}
