import { FeaturedSelection } from "@/components/home/featured-selection";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { SourcingBanner } from "@/components/home/sourcing-banner";
import { TrustSection } from "@/components/home/trust-section";
import { fetchProducts } from "@/lib/api";

// Catalogue alimenté par l'API Django : on évite la génération statique au
// build pour toujours refléter l'état réel du backend.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await fetchProducts();

  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <FeaturedSelection products={products} />
      <SourcingBanner />
      <TrustSection />
    </main>
  );
}
