"use client";

import Image from "next/image";
import { type MouseEvent, type TouchEvent, useRef, useState } from "react";

import { PlaceholderImage } from "@/components/common/placeholder-image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

interface ProductGalleryProps {
  images: ProductImage[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [isZooming, setIsZooming] = useState(false);
  // Un lien Cloudinary cassé ne doit jamais afficher l'icône "image cassée"
  // du navigateur — on bascule sur une vignette de repli. Indexé par id de
  // photo pour ne pas masquer les vignettes valides à côté d'une en échec.
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const frameRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const active = images[activeIndex] ?? images[0];

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  // Swipe tactile sur l'image principale (mobile/tablette) : le zoom au
  // survol ne se déclenche jamais au doigt, cette navigation le remplace.
  const SWIPE_THRESHOLD_PX = 40;

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || images.length < 2) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    setActiveIndex((prev) => {
      if (deltaX < 0) return (prev + 1) % images.length;
      return (prev - 1 + images.length) % images.length;
    });
  }

  if (!active) return null;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={frameRef}
        className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg bg-imperial-ivory"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {failedIds.has(active.id) ? (
          <PlaceholderImage hue={30} className="absolute inset-0" />
        ) : (
          <Image
            src={active.url}
            alt={active.alt}
            fill
            priority
            unoptimized
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out"
            style={{
              transformOrigin: zoomOrigin,
              transform: isZooming ? "scale(1.8)" : "scale(1)",
            }}
            onError={() => {
              console.error("Erreur de chargement d'image pour :", active.url);
              setFailedIds((prev) => new Set(prev).add(active.id));
            }}
          />
        )}
      </div>

      {/* Sur mobile, la bande de vignettes cède la place à de simples points
          (indicateur de carrousel), le doigt navigue par swipe sur la photo
          principale — la bande reste l'outil de navigation à partir de sm. */}
      {images.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5 sm:hidden">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Voir la photo ${index + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex ? "w-5 bg-imperial-gold" : "w-1.5 bg-imperial-black/15"
              )}
            />
          ))}
        </div>
      ) : null}

      {images.length > 1 ? (
        <div className="hidden gap-3 overflow-x-auto pb-1 sm:flex">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Voir la photo ${index + 1}`}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                index === activeIndex ? "border-imperial-gold" : "border-transparent"
              )}
            >
              {failedIds.has(image.id) ? (
                <PlaceholderImage hue={30} className="absolute inset-0" />
              ) : (
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                  onError={() => {
                    console.error("Erreur de chargement d'image pour :", image.url);
                    setFailedIds((prev) => new Set(prev).add(image.id));
                  }}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
