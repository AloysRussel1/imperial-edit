import type { Metadata } from "next";

import { SectionHeading } from "@/components/common/section-heading";
import { TrackingDetailContent } from "@/components/tracking/tracking-detail-content";

export const metadata: Metadata = {
  title: "Suivi de colis — Imperial Collection",
  description: "Suivez l'avancement de votre commande Imperial Collection avec votre numéro de suivi.",
};

interface TrackingDetailPageProps {
  params: { code: string };
}

export default function TrackingDetailPage({ params }: TrackingDetailPageProps) {
  return (
    <main className="container max-w-2xl py-16">
      <SectionHeading eyebrow="Suivi en direct" title="Où en est mon colis ?" className="mb-10" />
      <TrackingDetailContent code={params.code} />
    </main>
  );
}
