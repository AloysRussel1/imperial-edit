import Link from "next/link";
import { CreditCard, Gem, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

const HELP_LINKS = [
  { label: "FAQ — Livraison France ↔ Cameroun", href: "/faq" },
  { label: "Modes de paiement & acompte", href: "/faq#paiement" },
  { label: "Sourcing sur photo", href: "/sourcing" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-imperial-black/10 bg-imperial-charcoal text-imperial-ivory">
      <div className="container grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-imperial-gold" strokeWidth={1.5} />
            <span className="font-display text-lg">{SITE_NAME}</span>
          </Link>
          <p className="text-sm text-imperial-ivory/60">
            Maison de sourcing et de mode haut de gamme, basée en France, au service d&apos;une clientèle
            exigeante au Cameroun.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest2 text-imperial-gold">La Maison</h3>
          <ul className="space-y-2 text-sm text-imperial-ivory/75">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-imperial-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest2 text-imperial-gold">Aide &amp; Livraison</h3>
          <ul className="space-y-2 text-sm text-imperial-ivory/75">
            {HELP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-imperial-gold">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <WhatsAppButton
                variant="inline"
                className="text-imperial-ivory/75 hover:text-imperial-gold"
                message={`Bonjour, j'ai une question pour ${SITE_NAME}.`}
              >
                Support WhatsApp
              </WhatsAppButton>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest2 text-imperial-gold">Paiement sécurisé</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline-ivory" className="gap-1">
              <Smartphone className="h-3 w-3" /> MTN Mobile Money
            </Badge>
            <Badge variant="outline-ivory" className="gap-1">
              <Smartphone className="h-3 w-3" /> Orange Money
            </Badge>
            <Badge variant="outline-ivory" className="gap-1">
              <CreditCard className="h-3 w-3" /> Carte bancaire
            </Badge>
          </div>
          <p className="text-sm text-imperial-ivory/60">
            Acompte de 50% à 70% à la commande, solde réglé à la livraison au Cameroun.
          </p>
        </div>
      </div>

      <div className="border-t border-imperial-ivory/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-imperial-ivory/50 sm:flex-row">
          <p>
            © {year} {SITE_NAME} — Paris, France.
          </p>
          <p>Livraison soignée jusqu&apos;au Cameroun.</p>
        </div>
      </div>
    </footer>
  );
}
