import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HERO_IMAGE_URL } from "@/data/marketing-images";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden text-imperial-ivory sm:min-h-[88vh] lg:min-h-[82vh]">
      <Image
        src={HERO_IMAGE_URL}
        alt="Univers The Imperial Collection — mode et accessoires de luxe"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_25%]"
      />
      {/* Dégradé sombre/doré : garantit la lisibilité du texte quelle que soit la photo, et signe l'identité "haute couture". */}
      <div className="absolute inset-0 bg-gradient-to-t from-imperial-black via-imperial-black/75 to-imperial-black/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-imperial-black/50 via-transparent to-imperial-black/30" />
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 15%, rgba(201,162,75,0.22), transparent 42%), radial-gradient(circle at 88% 80%, rgba(201,162,75,0.16), transparent 48%)",
        }}
      />

      <div className="container relative flex flex-col items-center gap-5 py-20 text-center sm:gap-6 sm:py-24">
        <div className="flex animate-fade-in items-center gap-3 text-imperial-gold">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-imperial-gold sm:w-12" />
          <p className="whitespace-nowrap text-[0.65rem] uppercase tracking-widest2 sm:text-xs">
            Maison de Sourcing &amp; Haute Couture
          </p>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-imperial-gold sm:w-12" />
        </div>

        <h1 className="max-w-4xl text-balance font-display text-4xl leading-[1.08] sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in">
          Le luxe européen,
          <br className="hidden sm:block" /> sourcé pour vous.
        </h1>

        <p className="max-w-xl text-balance text-sm text-imperial-ivory/75 animate-fade-in sm:text-base">
          De Paris à Milan en passant par Londres, nous sélectionnons et acheminons avec soin sacs, souliers,
          prêt-à-porter et parfums d&apos;exception jusqu&apos;au Cameroun. Chaque pièce, une promesse
          d&apos;authenticité.
        </p>

        <div className="mt-2 flex w-full max-w-md flex-col gap-3 animate-fade-in sm:w-auto sm:max-w-none sm:flex-row">
          <Button asChild size="lg" variant="gold" className="w-full shadow-gold sm:w-auto">
            <Link href="/products">
              Découvrir la Collection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-imperial-ivory/30 text-imperial-ivory hover:bg-imperial-ivory/10 sm:w-auto"
          >
            <Link href="/sourcing">
              <Search className="mr-2 h-4 w-4" />
              Faire une Demande de Sourcing
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 hidden justify-center sm:flex">
        <ChevronDown className="h-5 w-5 text-imperial-ivory/50 motion-safe:animate-bounce" strokeWidth={1.5} />
      </div>
    </section>
  );
}
