"use client";

import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import type { Language } from "@/store/language-store";

const LANGUAGES: Language[] = ["fr", "en"];

interface LanguageSwitcherProps {
  /** "dark" pour un placement sur fond sombre (ex. bandeau d'annonces noir). */
  variant?: "light" | "dark";
}

export function LanguageSwitcher({ variant = "light" }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();
  const dark = variant === "dark";

  return (
    <div
      role="group"
      aria-label={t("languageSwitcher.ariaLabel")}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-1.5 text-xs font-medium tracking-wide",
        dark ? "text-imperial-ivory/40" : "text-imperial-black/30"
      )}
    >
      <span aria-hidden>[</span>
      {LANGUAGES.map((lng, index) => (
        <span key={lng} className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLanguage(lng)}
            aria-pressed={language === lng}
            aria-label={lng === "fr" ? t("languageSwitcher.switchToFr") : t("languageSwitcher.switchToEn")}
            className={cn(
              "rounded px-0.5 uppercase transition-colors",
              language === lng
                ? "text-imperial-gold"
                : dark
                  ? "text-imperial-ivory/70 hover:text-imperial-gold"
                  : "text-imperial-black/50 hover:text-imperial-gold"
            )}
          >
            {lng}
          </button>
          {index < LANGUAGES.length - 1 ? (
            <span className={dark ? "text-imperial-ivory/30" : "text-imperial-black/30"}>|</span>
          ) : null}
        </span>
      ))}
      <span aria-hidden>]</span>
    </div>
  );
}
