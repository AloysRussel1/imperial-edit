"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Banknote, Loader2, PackageSearch, ShieldAlert, ShoppingBag, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { AdminSourcingPanel } from "@/components/admin/admin-sourcing-panel";
import { fetchAdminSummary, fetchAllOrders, fetchAllSourcingRequests } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { AdminDashboardSummary, ApiOrder, ApiSourcingRequest } from "@/types";

function KpiCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Banknote;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-lg border border-imperial-gold/40 bg-gold-gradient p-5 shadow-gold"
          : "rounded-lg border border-imperial-black/10 bg-white p-5"
      }
    >
      <Icon className={accent ? "h-5 w-5 text-imperial-black/70" : "h-5 w-5 text-imperial-gold"} strokeWidth={1.5} />
      <p className="mt-3 text-2xl font-semibold text-imperial-black">{value}</p>
      <p className={cn("text-xs uppercase tracking-wide", accent ? "text-imperial-black/60" : "text-imperial-black/45")}>
        {label}
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state._hasHydrated);

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [requests, setRequests] = useState<ApiSourcingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [summaryData, ordersData, requestsData] = await Promise.all([
        fetchAdminSummary(),
        fetchAllOrders(),
        fetchAllSourcingRequests(),
      ]);
      setSummary(summaryData);
      setOrders(ordersData);
      setRequests(requestsData);
    } catch {
      setError("Impossible de charger les données administrateur.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      loadAll();
    } else {
      setLoading(false);
    }
  }, [user, loadAll]);

  if (!hydrated) {
    return null;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-imperial-black/10 bg-white p-10 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-imperial-gold" />
        <h2 className="font-display text-xl text-imperial-black">Accès réservé</h2>
        <p className="text-sm text-imperial-black/60">
          {user
            ? "Votre compte n'a pas les droits administrateur nécessaires pour accéder à cet espace."
            : "Connectez-vous avec un compte administrateur pour accéder à cet espace."}
        </p>
        {!user ? (
          <Button asChild variant="gold">
            <Link href="/login?next=/admin-dashboard">Se connecter</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-imperial-black/50">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement du tableau de bord…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="outline" onClick={loadAll}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-14">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          icon={Banknote}
          label="Chiffre d'affaires total"
          value={<Price amountXaf={summary?.total_revenue_xaf ?? 0} />}
          accent
        />
        <KpiCard icon={Wallet} label="Acomptes perçus" value={<Price amountXaf={summary?.total_collected_xaf ?? 0} />} />
        <KpiCard
          icon={Wallet}
          label="Soldes restants à encaisser"
          value={<Price amountXaf={summary?.total_outstanding_xaf ?? 0} />}
        />
        <KpiCard icon={ShoppingBag} label="Commandes actives" value={summary?.active_orders_count ?? 0} />
        <KpiCard icon={PackageSearch} label="Sourcing à traiter" value={summary?.pending_sourcing_count ?? 0} />
      </section>

      <section>
        <AdminOrdersTable orders={orders} onChanged={loadAll} />
      </section>

      <section>
        <AdminSourcingPanel requests={requests} onChanged={loadAll} />
      </section>
    </div>
  );
}
