import { BadgeCheck, HeadphonesIcon, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  { icon: Truck, title: "Livraison rapide", description: "France ↔ Cameroun, suivie de bout en bout." },
  { icon: RotateCcw, title: "Retour facile", description: "30 jours pour changer d'avis." },
  { icon: ShieldCheck, title: "Paiement sécurisé", description: "Mobile Money et carte bancaire." },
  { icon: BadgeCheck, title: "Garantie authenticité", description: "Chaque pièce vérifiée avant expédition." },
  { icon: HeadphonesIcon, title: "Support dédié", description: "Une équipe joignable sur WhatsApp." },
];

/** Bandeau de réassurance sous le Hero — 5 colonnes sur desktop, empilé/
 * défilant sur mobile pour rester lisible sans surcharger l'écran. */
export function TrustSection() {
  return (
    <section className="border-y border-imperial-black/10 bg-white py-10">
      <div className="container grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex flex-col items-center gap-2 text-center">
            <item.icon className="h-6 w-6 text-imperial-gold" strokeWidth={1.5} />
            <p className="font-display text-sm text-imperial-black">{item.title}</p>
            <p className="text-xs text-imperial-black/55">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
