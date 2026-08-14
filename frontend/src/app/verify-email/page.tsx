import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionHeading } from "@/components/common/section-heading";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Vérifier mon e-mail — The Imperial Collection",
  description: "Saisissez le code de vérification reçu par e-mail pour activer votre compte.",
};

export default function VerifyEmailPage() {
  return (
    <main className="container max-w-md py-16">
      <SectionHeading eyebrow="Espace client" title="Vérifiez votre e-mail" className="mb-8" />
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
