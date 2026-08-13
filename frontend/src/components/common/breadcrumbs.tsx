import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-imperial-black/50">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0" /> : null}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-imperial-gold">
              {item.label}
            </Link>
          ) : (
            <span className="text-imperial-black">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
