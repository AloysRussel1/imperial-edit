import type { Metadata } from "next";

import { SectionHeading } from "@/components/common/section-heading";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = {
  title: "Mon espace — The Imperial Collection",
  description: "Profil, commandes, sourcing et favoris.",
};

export default function DashboardPage() {
  return (
    <main className="container py-14">
      <SectionHeading
        align="left"
        eyebrow="Espace client"
        title="Mon espace"
        description="Profil, historique de commandes, demandes de sourcing et pièces favorites."
        className="mb-12"
      />
      <AccountShell />
    </main>
  );
}
