import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — The Imperial Edit",
  description: "Choisissez un nouveau mot de passe pour votre compte The Imperial Edit.",
};

export default function ResetPasswordPage() {
  return (
    <main className="container max-w-md py-16">
      <SectionHeading eyebrow="Espace client" title="Réinitialiser le mot de passe" className="mb-8" />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
