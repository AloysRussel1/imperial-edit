import { FeaturedSelection } from "@/components/home/featured-selection";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { SourcingBanner } from "@/components/home/sourcing-banner";
import { TrustSection } from "@/components/home/trust-section";

// Aucun fetch bloquant ici : la vitrine doit s'afficher instantanément même si
// le backend Render (plan gratuit, sujet à mise en veille) est lent à répondre
// ou temporairement indisponible. `FeaturedSelection` récupère son propre
// catalogue côté client (voir ce composant) au lieu de bloquer le rendu serveur.
// `force-dynamic` est déjà imposé globalement par le layout racine ; on le
// redéclare ici explicitement pour que cette page reste sûre même si ce
// réglage venait à être retiré du layout.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <FeaturedSelection />
      <SourcingBanner />
      <TrustSection />
    </main>
  );
}
