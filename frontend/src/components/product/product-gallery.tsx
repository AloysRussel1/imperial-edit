"use client";

import Image from "next/image";
import { type MouseEvent, useRef, useState } from "react";

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

  const active = images[activeIndex] ?? images[0];

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
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
      >
        {failedIds.has(active.id) ? (
          <PlaceholderImage hue={30} className="absolute inset-0" />
        ) : (
          <Image
            src={active.url}
            alt={active.alt}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out"
            style={{
              transformOrigin: zoomOrigin,
              transform: isZooming ? "scale(1.8)" : "scale(1)",
            }}
            onError={() => setFailedIds((prev) => new Set(prev).add(active.id))}
          />
        )}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
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
                  sizes="64px"
                  className="object-cover"
                  onError={() => setFailedIds((prev) => new Set(prev).add(image.id))}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
