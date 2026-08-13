import { RotateCcw, ShieldCheck, Truck } from "lucide-react";

interface ProductReassuranceProps {
  deliveryEstimate: string;
}

export function ProductReassurance({ deliveryEstimate }: ProductReassuranceProps) {
  const items = [
    { icon: Truck, title: "Livraison estimée", description: deliveryEstimate },
    { icon: ShieldCheck, title: "Paiement sécurisé", description: "Mobile Money ou carte, via CinetPay" },
    { icon: RotateCcw, title: "Retours 30 jours", description: "Satisfait ou repris selon nos conditions" },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-2.5 rounded-lg border border-imperial-black/10 bg-imperial-ivory p-3">
          <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-imperial-gold" strokeWidth={1.5} />
          <div>
            <p className="text-xs font-medium text-imperial-black">{item.title}</p>
            <p className="text-[0.7rem] text-imperial-black/55">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
