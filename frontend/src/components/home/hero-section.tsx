import { HeroBannerSlider } from "@/components/home/hero-banner-slider";
import { HeroCategorySidebar } from "@/components/home/hero-category-sidebar";
import { HeroPromoCards } from "@/components/home/hero-promo-cards";

/** Hero en grille à 3 zones (catégories | bannière | offre du jour) — la
 * sidebar catégories reste masquée en dessous de lg (voir HeroCategorySidebar),
 * la bannière et les cartes de droite s'empilent alors verticalement. */
export function HeroSection() {
  return (
    <section className="bg-imperial-ivory pb-10 pt-6 sm:pt-8">
      <div className="container">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-3">
            <HeroCategorySidebar />
          </div>
          <div className="lg:col-span-6">
            <HeroBannerSlider />
          </div>
          <div className="lg:col-span-3">
            <HeroPromoCards />
          </div>
        </div>
      </div>
    </section>
  );
}
