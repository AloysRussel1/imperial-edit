import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Espace vendeur — The Imperial Edit",
  description: "Vue d'ensemble des commandes, acomptes et demandes de sourcing.",
};

export default function AdminDashboardPage() {
  return (
    <main className="container py-14">
      <SectionHeading
        align="left"
        eyebrow="Back-office"
        title="Espace administrateur"
        description="Suivi des commandes, des soldes et des demandes de sourcing France ↔ Cameroun."
        className="mb-12"
      />
      <AdminDashboard />
    </main>
  );
}
