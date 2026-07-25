"use client";

import { type DragEvent, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  previewUrl: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
}

export function ImageDropzone({ previewUrl, onChange }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(file, typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  if (previewUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-imperial-black/10">
        <Image src={previewUrl} alt="Aperçu de l'article recherché" fill className="object-cover" unoptimized />
        <button
          type="button"
          onClick={() => onChange(null, null)}
          aria-label="Retirer la photo"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-imperial-black/70 text-imperial-ivory hover:bg-imperial-black"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors",
        isDragging ? "border-imperial-gold bg-imperial-gold/10" : "border-imperial-black/20 hover:border-imperial-gold"
      )}
    >
      <ImagePlus className="h-8 w-8 text-imperial-black/40" strokeWidth={1.5} />
      <p className="text-sm text-imperial-black/60">
        Glissez-déposez une photo ici, ou <span className="text-imperial-gold underline">parcourir</span>
      </p>
      <p className="text-xs text-imperial-black/40">JPG, PNG — 10 Mo max</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
