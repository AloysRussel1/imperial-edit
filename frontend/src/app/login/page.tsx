import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Connexion — The Imperial Edit",
  description: "Connectez-vous à votre espace The Imperial Edit.",
};

export default function LoginPage() {
  return (
    <main className="container max-w-md py-16">
      <SectionHeading eyebrow="Espace client" title="Se connecter" className="mb-8" />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
