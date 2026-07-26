"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/section-heading";
import { ProductGrid } from "@/components/product/product-grid";
import { fetchProducts } from "@/lib/api";
import type { ProductDetail } from "@/types";

// Récupération côté client (et non côté serveur) : la vitrine ne doit jamais
// dépendre d'un appel bloquant au backend pour s'afficher. Si le backend
// Render est lent à se réveiller (plan gratuit) ou momentanément injoignable,
// le reste de la page (Hero, etc.) reste visible et cette section se contente
// de rester en chargement / d'afficher un message d'attente plutôt que de
// faire échouer la page entière (l'ancienne version bloquait le rendu serveur
// sur `await fetchProducts()`). `apiClient` retente déjà 2 fois en cas
// d'erreur réseau/504/timeout (cold start Render) avant de rejeter — cet état
// "failed" ne s'affiche donc que si le backend reste réellement injoignable.
export function FeaturedSelection() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((error) => {
        console.error("Impossible de charger la sélection impériale :", error);
        if (!cancelled) {
          setProducts([]);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const featured = products?.filter((product) => product.is_featured).slice(0, 8) ?? null;

  return (
    <section className="bg-white py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Édition limitée"
          title="Sélection Impériale"
          description="Les pièces les plus recherchées de la maison, en quantités limitées."
        />
        <div className="mt-12">
          {failed ? (
            <p className="py-16 text-center text-imperial-black/50">
              Les produits se chargent, veuillez patienter quelques secondes...
            </p>
          ) : featured === null ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] w-full animate-pulse rounded-lg bg-imperial-black/5" />
              ))}
            </div>
          ) : (
            <ProductGrid products={featured} />
          )}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline">
            <Link href="/products">
              Voir tout le catalogue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
