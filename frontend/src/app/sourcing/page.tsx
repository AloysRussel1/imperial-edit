import type { Metadata } from "next";
import { Camera, MessageSquare, Search, Truck } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";
import { SourcingFlow } from "@/components/sourcing/sourcing-flow";

export const metadata: Metadata = {
  title: "Sourcing sur photo — The Imperial Edit",
  description: "Confiez-nous une photo, nous localisons et livrons la pièce jusqu'au Cameroun.",
};

const STEPS = [
  { icon: Camera, title: "Envoyez une photo", description: "Article vu en boutique, sur un site ou un réseau social." },
  { icon: Search, title: "Nous le localisons", description: "Notre équipe identifie la source la plus fiable et négocie le meilleur prix." },
  { icon: MessageSquare, title: "Devis & acompte", description: "Vous recevez un devis clair, puis réglez un acompte de 50% à 70%." },
  { icon: Truck, title: "Livraison au Cameroun", description: "L'article est expédié et suivi jusqu'à sa remise en main propre." },
];

export default function SourcingPage() {
  return (
    <main>
      <section className="bg-charcoal-gradient py-20 text-imperial-ivory">
        <div className="container text-center">
          <SectionHeading
            eyebrow="Service sur-mesure"
            title="Sourcing Sur Photo"
            description="Vous avez repéré une pièce introuvable dans notre catalogue ? Envoyez-nous une simple photo : nous nous chargeons du reste, de la négociation à la livraison au Cameroun."
            light
          />
        </div>
      </section>

      <section className="bg-imperial-ivory py-16">
        <div className="container grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.title} className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
                <step.icon className="h-6 w-6 text-imperial-black" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-lg text-imperial-black">{step.title}</h3>
              <p className="max-w-xs text-sm text-imperial-black/60">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container max-w-xl">
          <SectionHeading eyebrow="Votre demande" title="Décrivez la pièce que vous recherchez" className="mb-8" />
          <SourcingFlow />
        </div>
      </section>
    </main>
  );
}
