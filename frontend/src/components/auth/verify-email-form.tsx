"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resendVerificationOtp } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError && err.response?.data) {
    const firstMessage = Object.values(err.response.data).flat()[0];
    if (typeof firstMessage === "string") return firstMessage;
  }
  return fallback;
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const verifyEmail = useAuthStore((state) => state.verifyEmail);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function setDigit(index: number, value: string) {
    setDigits((prev) => prev.map((d, i) => (i === index ? value : d)));
  }

  function handleChange(index: number, rawValue: string) {
    const value = rawValue.replace(/\D/g, "").slice(-1);
    setDigit(index, value);
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDigits((prev) => prev.map((d, i) => pasted[i] ?? d));
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const code = digits.join("");
    if (code.length !== CODE_LENGTH) {
      setError("Merci de saisir les 6 chiffres du code.");
      return;
    }

    setVerifying(true);
    try {
      await verifyEmail({ email, code });
      router.push("/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err, "Code invalide ou expiré."));
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResending(true);
    try {
      await resendVerificationOtp(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible de renvoyer le code pour le moment."));
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="space-y-4 rounded-lg border border-imperial-black/10 bg-white p-6 text-center">
        <p className="text-sm text-imperial-black/60">
          Adresse e-mail manquante — recommencez l&apos;inscription pour recevoir un nouveau code.
        </p>
        <Button asChild variant="gold">
          <Link href="/register">Retour à l&apos;inscription</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-imperial-black/10 bg-white p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <MailCheck className="h-8 w-8 text-imperial-gold" strokeWidth={1.5} />
        <p className="text-sm text-imperial-black/60">
          Un code à 6 chiffres a été envoyé à <span className="font-medium text-imperial-black">{email}</span>.
          Saisissez-le ci-dessous pour activer votre compte.
        </p>
      </div>

      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Chiffre ${index + 1} du code`}
            className="h-12 w-10 rounded-md border border-imperial-black/15 bg-white text-center text-lg font-semibold text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold sm:h-14 sm:w-12"
          />
        ))}
      </div>

      {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={verifying}>
        {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Vérifier le code
      </Button>

      <div className="text-center text-sm text-imperial-black/60">
        Vous n&apos;avez rien reçu ?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="font-medium text-imperial-gold underline underline-offset-4 disabled:cursor-not-allowed disabled:text-imperial-black/30 disabled:no-underline"
        >
          {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : resending ? "Envoi…" : "Renvoyer le code"}
        </button>
      </div>
    </form>
  );
}
