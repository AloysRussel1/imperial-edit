import type { Metadata } from "next";

import { SectionHeading } from "@/components/common/section-heading";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";

export const metadata: Metadata = {
  title: "Mon espace — The Imperial Collection",
  description: "Suivez vos commandes et vos demandes de sourcing.",
};

export default function DashboardPage() {
  return (
    <main className="container py-14">
      <SectionHeading
        align="left"
        eyebrow="Espace client"
        title="Mes commandes & demandes"
        description="Retrouvez ici l'état de vos commandes et de vos demandes de sourcing sur photo."
        className="mb-12"
      />
      <CustomerDashboard />
    </main>
  );
}
