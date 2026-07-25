import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Mot de passe oublié — The Imperial Collection",
  description: "Réinitialisez le mot de passe de votre compte The Imperial Collection.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="container max-w-md py-16">
      <SectionHeading eyebrow="Espace client" title="Mot de passe oublié" className="mb-8" />
      <ForgotPasswordForm />
    </main>
  );
}
