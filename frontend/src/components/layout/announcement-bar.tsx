import { HeadphonesIcon, ShieldCheck, Truck } from "lucide-react";

import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

const ASSURANCES = [
  { icon: Truck, label: "Livraison France ↔ Cameroun" },
  { icon: ShieldCheck, label: "Authenticité garantie" },
  { icon: HeadphonesIcon, label: "Support 7j/7" },
];

/** Ligne d'assurance très fine au-dessus du header principal — repères de
 * confiance toujours visibles, sans concurrencer la hiérarchie du header. */
export function AnnouncementBar() {
  return (
    <div className="hidden border-b border-imperial-ivory/10 bg-imperial-black text-imperial-ivory/80 md:block">
      <div className="container flex h-9 items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          {ASSURANCES.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <item.icon className="h-3.5 w-3.5 text-imperial-gold" strokeWidth={1.5} />
              {item.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-imperial-ivory">
          <LanguageSwitcher variant="dark" />
          <CurrencySwitcher />
        </div>
      </div>
    </div>
  );
}
