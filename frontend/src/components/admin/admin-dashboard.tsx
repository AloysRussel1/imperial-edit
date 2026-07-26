"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Banknote, Loader2, PackageSearch, RefreshCw, ShieldAlert, ShoppingBag, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { AdminCatalogPanel } from "@/components/admin/admin-catalog-panel";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { AdminSourcingPanel } from "@/components/admin/admin-sourcing-panel";
import { useTranslation } from "@/hooks/use-translation";
import { fetchAdminSummary, fetchAllOrders, fetchAllSourcingRequests, fetchProducts } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { AdminDashboardSummary, ApiOrder, ApiSourcingRequest, ProductDetail } from "@/types";

/** Figure d'en-tête (hero figure) : un seul chiffre par vue, en police sans-serif — jamais la display/serif du reste du site. */
function HeroFigure({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Banknote;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-imperial-gold/40 bg-gold-gradient p-6 shadow-gold sm:p-8">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest2 text-imperial-black/60">{label}</p>
          <p className="mt-3 font-body text-4xl font-semibold tabular-nums text-imperial-black sm:text-5xl">{value}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-imperial-black/10">
          <Icon className="h-6 w-6 text-imperial-black/70" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

/** Stat tile : label (phrase, sans deux-points) + valeur (semi-gras). Pas de delta/sparkline fabriqués — l'API n'expose pas de série temporelle. */
function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Banknote;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="group rounded-xl border border-imperial-black/10 bg-white p-5 transition-shadow hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-imperial-ivory text-imperial-gold">
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <p className="text-xs uppercase tracking-wide text-imperial-black/45">{label}</p>
      </div>
      <p className="mt-3 font-body text-2xl font-semibold text-imperial-black">{value}</p>
    </div>
  );
}

export function AdminDashboard() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state._hasHydrated);

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [requests, setRequests] = useState<ApiSourcingRequest[]>([]);
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const [summaryData, ordersData, requestsData, productsData] = await Promise.all([
        fetchAdminSummary(),
        fetchAllOrders(),
        fetchAllSourcingRequests(),
        fetchProducts(),
      ]);
      setSummary(summaryData);
      setOrders(ordersData);
      setRequests(requestsData);
      setProducts(productsData);
    } catch {
      setError(t("admin.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

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
        <h2 className="font-display text-xl text-imperial-black">{t("admin.accessDeniedTitle")}</h2>
        <p className="text-sm text-imperial-black/60">
          {user ? t("admin.accessDeniedNoRole") : t("admin.accessDeniedGuest")}
        </p>
        {!user ? (
          <Button asChild variant="gold">
            <Link href="/login?next=/admin-dashboard">{t("admin.login")}</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-imperial-black/50">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("admin.loadingDashboard")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="outline" onClick={loadAll}>
          {t("admin.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest2 text-imperial-gold">{t("admin.badge")}</p>
          <h1 className="mt-1 font-display text-3xl text-imperial-black sm:text-4xl">{t("admin.title")}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={refreshing}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", refreshing && "animate-spin")} />
          {t("admin.refresh")}
        </Button>
      </header>

      <section className="space-y-4">
        <HeroFigure
          icon={Banknote}
          label={t("admin.kpi.totalRevenue")}
          value={<Price amountXaf={summary?.total_revenue_xaf ?? 0} />}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Wallet}
            label={t("admin.kpi.depositsCollected")}
            value={<Price amountXaf={summary?.total_collected_xaf ?? 0} />}
          />
          <KpiCard
            icon={Wallet}
            label={t("admin.kpi.outstandingBalance")}
            value={<Price amountXaf={summary?.total_outstanding_xaf ?? 0} />}
          />
          <KpiCard icon={ShoppingBag} label={t("admin.kpi.activeOrders")} value={summary?.active_orders_count ?? 0} />
          <KpiCard
            icon={PackageSearch}
            label={t("admin.kpi.pendingSourcing")}
            value={summary?.pending_sourcing_count ?? 0}
          />
        </div>
      </section>

      <section>
        <AdminOrdersTable orders={orders} onChanged={loadAll} />
      </section>

      <section>
        <AdminSourcingPanel requests={requests} onChanged={loadAll} />
      </section>

      <section>
        <AdminCatalogPanel products={products} />
      </section>
    </div>
  );
}
