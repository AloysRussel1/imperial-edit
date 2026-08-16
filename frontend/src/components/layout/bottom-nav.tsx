"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";

import { SearchDialog } from "@/components/layout/search-dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { cartTotalCount, useCartStore } from "@/store/cart-store";

// Ces routes ont déjà leur propre barre d'action fixe en bas d'écran
// (PurchasePanel, CheckoutFlow) ou leur propre navigation (AccountShell) :
// superposer la barre de navigation inférieure y créerait un conflit visuel
// (deux barres fixes l'une sur l'autre) ou une redondance de navigation.
function isHidden(pathname: string): boolean {
  if (pathname.startsWith("/checkout")) return true;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/admin-dashboard")) return true;
  // Fiche produit (`/products/mon-sac`), mais pas le catalogue lui-même
  // (`/products` tout court).
  if (/^\/products\/[^/]+\/?$/.test(pathname)) return true;
  return false;
}

function NavIcon({
  active,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  icon: typeof Home;
  label: string;
  badge?: number;
}) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      {/* Le badge s'ancre sur l'icône elle-même (pas sur la cellule de grille
          qui l'entoure, dont la largeur varie) — toujours au bon endroit,
          quelle que soit la largeur d'écran. */}
      <span className="relative">
        <Icon className={cn("h-5 w-5", active ? "text-imperial-gold" : "text-imperial-black/55")} strokeWidth={1.75} />
        {badge && badge > 0 ? (
          <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-imperial-gold px-1 text-[9px] font-semibold text-imperial-black">
            {badge}
          </span>
        ) : null}
      </span>
      <span className={cn("text-[0.65rem] leading-none", active ? "font-medium text-imperial-gold" : "text-imperial-black/55")}>
        {label}
      </span>
    </span>
  );
}

/**
 * Barre de navigation inférieure — accès rapide mobile aux 5 destinations
 * clés de la vitrine (Accueil, Catalogue, Recherche, Panier, Compte).
 * `md:hidden` : même seuil que le burger du header (MobileNav) — à partir de
 * `md:`, le header affiche déjà sa propre navigation complète (catégories +
 * liens), doubler avec cette barre y serait redondant.
 */
export function BottomNav() {
  const pathname = usePathname();
  const hydrated = useAuthStore((state) => state._hasHydrated);
  const count = useCartStore((state) => cartTotalCount(state.items));

  if (isHidden(pathname)) return null;

  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/products") && !/^\/products\/[^/]+\/?$/.test(pathname);
  const isCart = pathname.startsWith("/cart");
  const isAccount = pathname.startsWith("/dashboard") || pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <>
      {/* Réserve l'espace occupé par la barre fixe ci-dessous, pour que le
          pied de page (ou le dernier bloc de contenu) ne se retrouve jamais
          masqué derrière elle une fois arrivé en bas de la page. */}
      <div aria-hidden className="h-16 md:hidden [padding-bottom:env(safe-area-inset-bottom)]" />
      {/* `will-change-transform` : même correctif que le Header sticky (voir
          son commentaire) — `position: fixed` + `backdrop-blur` sur mobile
          Safari peut aussi provoquer un décalage/scintillement pendant le
          défilement, la barre étant recalculée à chaque frame plutôt que
          promue sur son propre calque GPU stable. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-imperial-black/10 bg-imperial-ivory/95 backdrop-blur will-change-transform [padding-bottom:env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navigation principale"
      >
        <Link href="/" className="flex h-16 items-center justify-center" aria-current={isHome ? "page" : undefined}>
          <NavIcon active={isHome} icon={Home} label="Accueil" />
        </Link>
        <Link
          href="/products"
          className="flex h-16 items-center justify-center"
          aria-current={isCatalog ? "page" : undefined}
        >
          <NavIcon active={isCatalog} icon={LayoutGrid} label="Catalogue" />
        </Link>
        <SearchDialog
          trigger={
            <button type="button" className="flex h-16 items-center justify-center" aria-label="Rechercher">
              <NavIcon active={false} icon={Search} label="Recherche" />
            </button>
          }
        />
        <Link href="/cart" className="flex h-16 items-center justify-center" aria-current={isCart ? "page" : undefined}>
          <NavIcon active={isCart} icon={ShoppingBag} label="Panier" badge={hydrated ? count : 0} />
        </Link>
        <Link
          href="/dashboard"
          className="flex h-16 items-center justify-center"
          aria-current={isAccount ? "page" : undefined}
        >
          <NavIcon active={isAccount} icon={User} label="Mon compte" />
        </Link>
      </nav>
    </>
  );
}
