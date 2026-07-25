import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Créer un compte — The Imperial Edit",
  description: "Créez votre compte pour commander et suivre vos demandes de sourcing.",
};

export default function RegisterPage() {
  return (
    <main className="container max-w-md py-16">
      <SectionHeading eyebrow="Espace client" title="Créer un compte" className="mb-8" />
      <RegisterForm />
    </main>
  );
}
