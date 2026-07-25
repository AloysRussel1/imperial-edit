"use client";

import { useMemo, useState } from "react";
import { Loader2, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Price } from "@/components/common/price";
import { useTranslation } from "@/hooks/use-translation";
import { advanceOrderStatus, settleOrderBalance } from "@/lib/api";
import { getOrderStatusMeta, ORDER_STATUS_META, ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import type { ApiOrder, ApiOrderStatus } from "@/types";

interface AdminOrdersTableProps {
  orders: ApiOrder[];
  onChanged: () => void;
}

interface RowActionsProps {
  order: ApiOrder;
  busy: boolean;
  onAdvance: (orderId: string, status: ApiOrderStatus, note: string) => void;
  onSettle: (orderId: string) => void;
}

/** Menu d'action rapide : avancer d'un clic + note de suivi visible instantanément côté client. */
function AdvanceStatusDialog({ order, busy, onAdvance }: Omit<RowActionsProps, "onSettle">) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ApiOrderStatus>(order.status);
  const [note, setNote] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setStatus(order.status);
      setNote("");
    }
  }

  function handleSubmit() {
    onAdvance(order.id, status, note);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-1 py-0.5 transition-colors hover:border-imperial-gold/40 disabled:opacity-50"
          aria-label={t("admin.orders.advanceStatusAria", { number: order.order_number })}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-imperial-black/40" />
          ) : (
            <Badge variant={getOrderStatusMeta(order.status).variant}>
              {getOrderStatusMeta(order.status).labelKey ? t(getOrderStatusMeta(order.status).labelKey) : order.status}
            </Badge>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Faire avancer — {order.order_number}</DialogTitle>
          <DialogDescription>La note s&apos;affiche instantanément sur la frise du client.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor={`advance-status-${order.id}`}>Nouvelle étape</Label>
          <select
            id={`advance-status-${order.id}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as ApiOrderStatus)}
            className="h-10 w-full rounded-md border border-imperial-black/15 bg-white px-3 text-sm text-imperial-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(ORDER_STATUS_META[option].labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`advance-note-${order.id}`}>Note de suivi (optionnelle)</Label>
          <textarea
            id={`advance-note-${order.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Ex. « Vol cargo confirmé — arrivée prévue mardi à Douala »"
            className="w-full rounded-md border border-imperial-black/15 bg-white px-3 py-2 text-sm text-imperial-black placeholder:text-imperial-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-gold"
          />
        </div>

        <Button variant="gold" className="w-full" onClick={handleSubmit}>
          <Truck className="mr-2 h-4 w-4" />
          Mettre à jour le suivi
        </Button>
      </DialogContent>
    </Dialog>
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

  async function handleAdvance(orderId: string, status: ApiOrderStatus, note: string) {
    setBusyId(orderId);
    try {
      await advanceOrderStatus(orderId, status, note);
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
                {order.tracking_number ? ` · ${order.tracking_number}` : ""}
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
            <AdvanceStatusDialog order={order} busy={busyId === order.id} onAdvance={handleAdvance} />
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
                <td className="px-4 py-3 font-medium text-imperial-black">
                  {order.order_number}
                  {order.tracking_number ? (
                    <span className="block text-xs font-normal text-imperial-black/40">{order.tracking_number}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-imperial-black/70">{order.customer_name || "—"}</td>
                <td className="px-4 py-3 text-imperial-black/70">{order.delivery_city}</td>
                <td className="px-4 py-3 tabular-nums text-imperial-black/70">
                  <Price amountXaf={Number(order.amount_paid_xaf)} /> / <Price amountXaf={Number(order.total_xaf)} />
                </td>
                <td className="px-4 py-3">
                  <AdvanceStatusDialog order={order} busy={busyId === order.id} onAdvance={handleAdvance} />
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
