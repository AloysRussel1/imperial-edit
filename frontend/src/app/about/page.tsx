import type { Metadata } from "next";
import { Gem, Handshake, MapPin } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "À Propos — The Imperial Collection",
  description: "L'histoire et les valeurs de The Imperial Collection, maison de mode et de sourcing France-Cameroun.",
};

const VALUES = [
  {
    icon: Gem,
    title: "Exigence",
    description: "Chaque pièce est sélectionnée pour sa qualité de fabrication et son authenticité.",
  },
  {
    icon: Handshake,
    title: "Confiance",
    description: "Un acompte raisonnable, un solde à la livraison, une relation transparente avec chaque client.",
  },
  {
    icon: MapPin,
    title: "Proximité",
    description: "Basés en France, tournés vers le Cameroun : nous connaissons les deux rives de chaque commande.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <section className="bg-charcoal-gradient py-20 text-imperial-ivory">
        <div className="container text-center">
          <SectionHeading
            eyebrow="La Maison"
            title="À Propos de The Imperial Collection"
            description="Née de la volonté de rapprocher la mode européenne des envies camerounaises, The Imperial Collection sélectionne, négocie et achemine des pièces d'exception jusqu'à vous."
            light
          />
        </div>
      </section>

      <section className="bg-imperial-ivory py-16">
        <div className="container max-w-3xl space-y-6 text-imperial-black/75">
          <p>
            The Imperial Collection est une maison de mode et de sourcing basée en France, fondée pour offrir à une
            clientèle exigeante au Cameroun un accès direct à des pièces de qualité premium — sacs, souliers,
            prêt-à-porter et parfums — habituellement difficiles à obtenir sur place.
          </p>
          <p>
            Notre catalogue rassemble une sélection resserrée d&apos;articles disponibles à la commande, complétée
            par un service de sourcing sur photo pour les envies plus spécifiques. Chaque commande est réglée par
            un acompte à la commande (50% ou 70% selon l&apos;article), le solde étant dû à la livraison —
            une formule pensée pour la confiance mutuelle.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container grid grid-cols-1 gap-10 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="flex flex-col items-center gap-3 text-center">
              <value.icon className="h-8 w-8 text-imperial-gold" strokeWidth={1.5} />
              <h3 className="font-display text-lg text-imperial-black">{value.title}</h3>
              <p className="max-w-xs text-sm text-imperial-black/60">{value.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
