import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HERO_IMAGE_URL } from "@/data/marketing-images";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden text-imperial-ivory">
      <Image
        src={HERO_IMAGE_URL}
        alt="Univers The Imperial Edit — mode et accessoires de luxe"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-imperial-black via-imperial-black/70 to-imperial-black/40" />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(201,162,75,0.18), transparent 40%), radial-gradient(circle at 85% 75%, rgba(201,162,75,0.12), transparent 45%)",
        }}
      />
      <div className="container relative flex min-h-[80vh] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="text-xs uppercase tracking-widest2 text-imperial-gold animate-fade-in">
          Impérial Collection — France ↔ Cameroun
        </p>
        <h1 className="max-w-3xl text-balance font-display text-5xl leading-tight md:text-7xl animate-fade-in">
          Le luxe sourcé pour vous, livré jusqu&apos;à vous.
        </h1>
        <p className="max-w-xl text-balance text-imperial-ivory/70 animate-fade-in">
          Sacs, souliers, prêt-à-porter et parfums d&apos;exception, sélectionnés en France et acheminés avec
          soin jusqu&apos;au Cameroun. Chaque pièce, une promesse d&apos;authenticité.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row animate-fade-in">
          <Button asChild size="lg" variant="gold">
            <Link href="/products">
              Explorer le Catalogue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-imperial-ivory/30 text-imperial-ivory hover:bg-imperial-ivory/10"
          >
            <Link href="/sourcing">
              <Search className="mr-2 h-4 w-4" />
              Demander un Sourcing
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
