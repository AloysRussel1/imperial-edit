import { CreditCard, PackageCheck, ShoppingBag } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";

const STEPS = [
  {
    icon: ShoppingBag,
    title: "1. Vous commandez",
    description:
      "Choisissez votre pièce dans le catalogue ou confiez-nous une recherche sur photo. Nous confirmons la disponibilité sous 48h.",
  },
  {
    icon: CreditCard,
    title: "2. Acompte 50% ou 70%",
    description:
      "Un acompte est réglé à la commande via Mobile Money (MTN, Orange) ou carte bancaire, selon l'article. Le solde est dû à la livraison.",
  },
  {
    icon: PackageCheck,
    title: "3. Expédition & livraison",
    description:
      "Votre article est expédié depuis la France et suivi jusqu'à sa remise en main propre au Cameroun.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-imperial-ivory py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Simple & transparent"
          title="Comment ça marche ?"
          description="De la sélection à la livraison, un parcours pensé pour la confiance et la clarté."
        />
        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
                <step.icon className="h-7 w-7 text-imperial-black" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl text-imperial-black">{step.title}</h3>
              <p className="max-w-xs text-sm text-imperial-black/60">{step.description}</p>
              {index < STEPS.length - 1 ? (
                <div className="absolute right-[-1.25rem] top-8 hidden h-px w-10 bg-imperial-gold/40 md:block" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
