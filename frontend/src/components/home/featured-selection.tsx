import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/section-heading";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductDetail } from "@/types";

interface FeaturedSelectionProps {
  products: ProductDetail[];
}

export function FeaturedSelection({ products }: FeaturedSelectionProps) {
  const featured = products.filter((product) => product.is_featured).slice(0, 8);

  return (
    <section className="bg-white py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Édition limitée"
          title="Sélection Impériale"
          description="Les pièces les plus recherchées de la maison, en quantités limitées."
        />
        <div className="mt-12">
          <ProductGrid products={featured} />
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
