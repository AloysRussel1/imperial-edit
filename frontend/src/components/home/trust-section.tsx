import { BadgeCheck, MapPinned, ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    icon: BadgeCheck,
    title: "Authenticité garantie",
    description: "Chaque pièce est vérifiée avant expédition. Satisfaction ou reprise selon nos conditions.",
  },
  {
    icon: ShieldCheck,
    title: "Paiement sécurisé",
    description: "Mobile Money (MTN, Orange) et carte bancaire, via des partenaires de paiement certifiés.",
  },
  {
    icon: MapPinned,
    title: "Suivi de colis",
    description: "Un numéro de suivi vous est communiqué dès l'expédition, jusqu'à la livraison au Cameroun.",
  },
];

export function TrustSection() {
  return (
    <section className="border-t border-imperial-black/10 bg-imperial-ivory py-16">
      <div className="container grid grid-cols-1 gap-10 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex flex-col items-center gap-3 text-center">
            <item.icon className="h-8 w-8 text-imperial-gold" strokeWidth={1.5} />
            <h3 className="font-display text-lg text-imperial-black">{item.title}</h3>
            <p className="max-w-xs text-sm text-imperial-black/60">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
