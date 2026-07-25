"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { useTranslation } from "@/hooks/use-translation";
import { advanceOrderStatus, settleOrderBalance } from "@/lib/api";
import { ORDER_STATUS_META, ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import type { ApiOrder, ApiOrderStatus } from "@/types";

interface AdminOrdersTableProps {
  orders: ApiOrder[];
  onChanged: () => void;
}

interface RowActionsProps {
  order: ApiOrder;
  busy: boolean;
  onAdvance: (orderId: string, status: ApiOrderStatus) => void;
  onSettle: (orderId: string) => void;
}

function StatusControl({ order, busy, onAdvance }: Omit<RowActionsProps, "onSettle">) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Badge variant={ORDER_STATUS_META[order.status].variant}>{t(ORDER_STATUS_META[order.status].labelKey)}</Badge>
      <select
        value={order.status}
        disabled={busy}
        onChange={(e) => onAdvance(order.id, e.target.value as ApiOrderStatus)}
        className="h-8 rounded-md border border-imperial-black/15 bg-white px-2 text-xs disabled:opacity-50"
        aria-label={t("admin.orders.advanceStatusAria", { number: order.order_number })}
      >
        {ORDER_STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {t(ORDER_STATUS_META[status].labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}

function BalanceAction({ order, busy, onSettle }: Omit<RowActionsProps, "onAdvance">) {
  const { t } = useTranslation();
  const remaining = Number(order.amount_remaining_xaf);
  if (busy) return <Loader2 className="h-4 w-4 animate-spin text-imperial-black/40" />;
  if (remaining > 0) {
    return (
      <Button size="sm" variant="outline" onClick={() => onSettle(order.id)}>
        {t("admin.orders.settleBalance")}
      </Button>
    );
  }
  return <Badge variant="success">{t("admin.orders.settled")}</Badge>;
}

export function AdminOrdersTable({ orders, onChanged }: AdminOrdersTableProps) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<ApiOrderStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  );

  async function handleAdvance(orderId: string, status: ApiOrderStatus) {
    setBusyId(orderId);
    try {
      await advanceOrderStatus(orderId, status);
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleSettle(orderId: string) {
    setBusyId(orderId);
    try {
      await settleOrderBalance(orderId);
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl text-imperial-black">{t("admin.orders.title")}</h2>
          <span className="rounded-full bg-imperial-ivory px-2 py-0.5 text-xs font-medium tabular-nums text-imperial-black/50">
            {filtered.length}
          </span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApiOrderStatus | "all")}
          className="h-9 rounded-md border border-imperial-black/15 bg-white px-3 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
        >
          <option value="all">{t("admin.orders.allStatuses")}</option>
          {ORDER_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {t(ORDER_STATUS_META[status].labelKey)}
            </option>
          ))}
        </select>
      </div>

      {/* Cartes empilées : lisibles sans défilement horizontal sur mobile/tablette. */}
      <div className="space-y-3 md:hidden">
        {filtered.map((order) => (
          <div key={order.id} className="space-y-3 rounded-xl border border-imperial-black/10 bg-white p-4">
            <div>
              <p className="font-medium text-imperial-black">{order.order_number}</p>
              <p className="text-xs text-imperial-black/50">
                {order.customer_name || "—"} · {order.delivery_city}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm tabular-nums text-imperial-black/70">
              <span className="text-xs uppercase tracking-wide text-imperial-black/40">
                {t("admin.orders.colPaidTotal")}
              </span>
              <span>
                <Price amountXaf={Number(order.amount_paid_xaf)} /> / <Price amountXaf={Number(order.total_xaf)} />
              </span>
            </div>
            <StatusControl order={order} busy={busyId === order.id} onAdvance={handleAdvance} />
            <div className="flex justify-end border-t border-imperial-black/10 pt-3">
              <BalanceAction order={order} busy={busyId === order.id} onSettle={handleSettle} />
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-imperial-black/10 bg-white p-8 text-center text-imperial-black/40">
            {t("admin.orders.empty")}
          </p>
        ) : null}
      </div>

      {/* Tableau classique à partir de md : défilement horizontal fluide si la fenêtre reste étroite. */}
      <div className="hidden overflow-x-auto rounded-xl border border-imperial-black/10 bg-white md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-imperial-black/10 bg-imperial-ivory text-xs uppercase tracking-wide text-imperial-black/50">
            <tr>
              <th className="px-4 py-3 font-medium">{t("admin.orders.colOrder")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.colCustomer")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.colCity")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.colPaidTotal")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.colStatus")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr
                key={order.id}
                className="border-b border-imperial-black/5 transition-colors last:border-0 hover:bg-imperial-ivory/50"
              >
                <td className="px-4 py-3 font-medium text-imperial-black">{order.order_number}</td>
                <td className="px-4 py-3 text-imperial-black/70">{order.customer_name || "—"}</td>
                <td className="px-4 py-3 text-imperial-black/70">{order.delivery_city}</td>
                <td className="px-4 py-3 tabular-nums text-imperial-black/70">
                  <Price amountXaf={Number(order.amount_paid_xaf)} /> / <Price amountXaf={Number(order.total_xaf)} />
                </td>
                <td className="px-4 py-3">
                  <StatusControl order={order} busy={busyId === order.id} onAdvance={handleAdvance} />
                </td>
                <td className="px-4 py-3">
                  <BalanceAction order={order} busy={busyId === order.id} onSettle={handleSettle} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-imperial-black/40">
                  {t("admin.orders.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
