"use client";

import Link from "next/link";
import { CreditCard, Gem, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { useTranslation } from "@/hooks/use-translation";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

const HELP_LINKS = [
  { labelKey: "footer.faqLink", href: "/faq" },
  { labelKey: "footer.paymentLink", href: "/faq#paiement" },
  { labelKey: "footer.sourcingLink", href: "/sourcing" },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-imperial-black/10 bg-imperial-charcoal text-imperial-ivory">
      <div className="container grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-imperial-gold" strokeWidth={1.5} />
            <span className="font-display text-lg">{SITE_NAME}</span>
          </Link>
          <p className="text-sm text-imperial-ivory/60">{t("footer.tagline")}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest2 text-imperial-gold">{t("footer.houseTitle")}</h3>
          <ul className="space-y-2 text-sm text-imperial-ivory/75">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-imperial-gold">
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest2 text-imperial-gold">{t("footer.helpTitle")}</h3>
          <ul className="space-y-2 text-sm text-imperial-ivory/75">
            {HELP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-imperial-gold">
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
            <li>
              <WhatsAppButton
                variant="inline"
                className="text-imperial-ivory/75 hover:text-imperial-gold"
                message={t("footer.whatsappMessage", { siteName: SITE_NAME })}
              >
                {t("footer.whatsappSupport")}
              </WhatsAppButton>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest2 text-imperial-gold">{t("footer.securePaymentTitle")}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline-ivory" className="gap-1">
              <Smartphone className="h-3 w-3" /> MTN Mobile Money
            </Badge>
            <Badge variant="outline-ivory" className="gap-1">
              <Smartphone className="h-3 w-3" /> Orange Money
            </Badge>
            <Badge variant="outline-ivory" className="gap-1">
              <CreditCard className="h-3 w-3" /> {t("checkout.paymentMethods.card")}
            </Badge>
          </div>
          <p className="text-sm text-imperial-ivory/60">{t("footer.depositNote")}</p>
        </div>
      </div>

      <div className="border-t border-imperial-ivory/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-imperial-ivory/50 sm:flex-row">
          <p>{t("footer.copyright", { year, siteName: SITE_NAME })}</p>
          <p>{t("footer.deliveryNote")}</p>
        </div>
      </div>
    </footer>
  );
}
