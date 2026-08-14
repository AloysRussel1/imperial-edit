"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  PackageSearch,
  Settings,
  ShoppingBag,
  User,
  UserCircle,
  UserPlus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDjangoAdminUrl } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export function AccountMenu() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Mon compte"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:text-imperial-gold"
        >
          <User className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{user ? `Bonjour, ${user.first_name || user.email}` : "Mon compte"}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!user ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Se connecter
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Créer un compte
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {/* Visible pour tout compte connecté, quel que soit son rôle. */}
            <DropdownMenuItem asChild>
              <Link href="/dashboard?tab=profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard?tab=orders" className="flex items-center gap-2">
                <PackageSearch className="h-4 w-4" />
                Mes commandes
              </Link>
            </DropdownMenuItem>

            {user.role === "vendor" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard?tab=vendor-products"
                    className="flex items-center gap-2 font-medium text-imperial-gold"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Gestion de ma Boutique
                  </Link>
                </DropdownMenuItem>
              </>
            ) : null}

            {user.role === "admin" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin-dashboard" className="flex items-center gap-2 font-medium text-imperial-gold">
                    <LayoutDashboard className="h-4 w-4" />
                    Tableau de bord Plateforme
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={getDjangoAdminUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Administration Django
                  </a>
                </DropdownMenuItem>
              </>
            ) : null}

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="flex items-center gap-2 text-red-700">
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
