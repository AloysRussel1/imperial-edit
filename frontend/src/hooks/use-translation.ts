"use client";

import { useCallback } from "react";

import { translations } from "@/lib/i18n/translations";
import { useLanguageStore } from "@/store/language-store";

function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function interpolate(value: string, vars?: Record<string, string | number>): string {
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (result, [key, val]) => result.split(`{{${key}}}`).join(String(val)),
    value
  );
}

/** Hook i18n léger : lookup par clé pointée (ex. "checkout.step1Title") avec repli sur le français. */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = getPath(translations[language], key) ?? getPath(translations.fr, key) ?? key;
      return interpolate(typeof raw === "string" ? raw : String(raw), vars);
    },
    [language]
  );

  const tList = useCallback(
    (key: string): string[] => {
      const raw = getPath(translations[language], key) ?? getPath(translations.fr, key) ?? [];
      return Array.isArray(raw) ? (raw as string[]) : [];
    },
    [language]
  );

  return { t, tList, language, setLanguage };
}
