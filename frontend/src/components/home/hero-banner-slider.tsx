"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HERO_SLIDES } from "@/data/marketing-images";

const AUTOPLAY_DELAY_MS = 6000;

/** Bandeau central du Hero : rotation automatique + navigation manuelle par
 * puces, en fondu — colonne centrale du grid à 3 zones de la page d'accueil. */
export function HeroBannerSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % HERO_SLIDES.length);
    }, AUTOPLAY_DELAY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl text-imperial-ivory sm:aspect-[16/11]">
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={slide.imageUrl}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            index === active ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-hidden={index !== active}
        >
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-imperial-black via-imperial-black/70 to-imperial-black/30" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest2 text-imperial-gold">{slide.eyebrow}</p>
            <h2 className="max-w-md text-balance font-display text-2xl leading-tight sm:text-3xl">{slide.title}</h2>
            <p className="max-w-md text-balance text-sm text-imperial-ivory/75">{slide.description}</p>
            <Button asChild size="sm" variant="gold" className="mt-1">
              <Link href={slide.ctaHref}>
                {slide.ctaLabel}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      ))}

      <div className="absolute right-6 top-6 flex gap-2">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.imageUrl}
            type="button"
            aria-label={`Voir le visuel ${index + 1}`}
            aria-current={index === active}
            onClick={() => setActive(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === active ? "w-6 bg-imperial-gold" : "w-2 bg-imperial-ivory/50 hover:bg-imperial-ivory/80"
            )}
          />
        ))}
      </div>
    </div>
  );
}
