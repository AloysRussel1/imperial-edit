"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";
import { advanceOrderStatus, settleOrderBalance } from "@/lib/api";
import { ORDER_STATUS_META, ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import type { ApiOrder, ApiOrderStatus } from "@/types";

interface AdminOrdersTableProps {
  orders: ApiOrder[];
  onChanged: () => void;
}

export function AdminOrdersTable({ orders, onChanged }: AdminOrdersTableProps) {
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-imperial-black">Gestion des commandes</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApiOrderStatus | "all")}
          className="h-9 rounded-md border border-imperial-black/15 bg-white px-3 text-sm text-imperial-black"
        >
          <option value="all">Tous les statuts</option>
          {ORDER_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_META[status].label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-imperial-black/10 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-imperial-black/10 bg-imperial-ivory text-xs uppercase tracking-wide text-imperial-black/50">
            <tr>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Payé / Total</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => {
              const remaining = Number(order.amount_remaining_xaf);
              const isBusy = busyId === order.id;
              return (
                <tr key={order.id} className="border-b border-imperial-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-imperial-black">{order.order_number}</td>
                  <td className="px-4 py-3 text-imperial-black/70">{order.customer_name || "—"}</td>
                  <td className="px-4 py-3 text-imperial-black/70">{order.delivery_city}</td>
                  <td className="px-4 py-3 text-imperial-black/70">
                    <Price amountXaf={Number(order.amount_paid_xaf)} /> / <Price amountXaf={Number(order.total_xaf)} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={isBusy}
                      onChange={(e) => handleAdvance(order.id, e.target.value as ApiOrderStatus)}
                      className="h-8 rounded-md border border-imperial-black/15 bg-white px-2 text-xs disabled:opacity-50"
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_META[status].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin text-imperial-black/40" />
                    ) : remaining > 0 ? (
                      <Button size="sm" variant="outline" onClick={() => handleSettle(order.id)}>
                        Valider réception du solde
                      </Button>
                    ) : (
                      <Badge variant="success">Soldé</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-imperial-black/40">
                  Aucune commande pour ce filtre.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
