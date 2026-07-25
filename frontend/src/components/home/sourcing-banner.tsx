import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, MessageCircle, PackageCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SOURCING_AFTER_IMAGE, SOURCING_BEFORE_IMAGE } from "@/data/marketing-images";

export function SourcingBanner() {
  return (
    <section className="bg-imperial-black py-20 text-imperial-ivory">
      <div className="container grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-imperial-gold/40">
            <Camera className="h-6 w-6 text-imperial-gold" strokeWidth={1.5} />
          </div>
          <p className="text-xs uppercase tracking-widest2 text-imperial-gold">Service sur-mesure</p>
          <h2 className="max-w-2xl text-balance font-display text-3xl md:text-4xl">
            Vous avez repéré une pièce ? Envoyez-nous la photo.
          </h2>
          <p className="max-w-xl text-balance text-imperial-ivory/65">
            Notre équipe de sourcing localise et négocie pour vous l&apos;article de vos envies, où qu&apos;il se
            trouve, puis l&apos;achemine jusqu&apos;au Cameroun dans les mêmes conditions de confiance.
          </p>
          <Button asChild size="lg" variant="gold">
            <Link href="/sourcing">
              Demander un Sourcing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
              <Image
                src={SOURCING_BEFORE_IMAGE.url}
                alt={SOURCING_BEFORE_IMAGE.alt}
                fill
                sizes="(min-width: 1024px) 20vw, 40vw"
                className="object-cover"
              />
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-imperial-ivory/60">
              <MessageCircle className="h-3.5 w-3.5 text-imperial-gold" /> 1. Photo envoyée sur WhatsApp
            </p>
          </div>
          <div className="space-y-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
              <Image
                src={SOURCING_AFTER_IMAGE.url}
                alt={SOURCING_AFTER_IMAGE.alt}
                fill
                sizes="(min-width: 1024px) 20vw, 40vw"
                className="object-cover"
              />
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-imperial-ivory/60">
              <PackageCheck className="h-3.5 w-3.5 text-imperial-gold" /> 2. Article déniché &amp; livré
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
