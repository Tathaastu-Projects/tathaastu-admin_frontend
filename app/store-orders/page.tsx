"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search,
  RefreshCw,
  Package,
  Phone,
  MapPin,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = "placed" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface OrderItem {
  _id?: string;
  productId: string;
  slug: string;
  title: string;
  image?: string;
  variantId?: string | null;
  variantLabel?: string;
  sku?: string;
  quantity: number;
  unitMrp: number;
  unitSalePrice: number;
  lineTotal: number;
}

interface StoreOrder {
  _id: string;
  orderNumber: string;
  customer: { name: string; email?: string; phone: string };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  items: OrderItem[];
  pricing: { subtotal: number; discount: number; shipping: number; total: number };
  paymentMethod: "cod" | "online";
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes?: string;
  adminNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

const STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function statusTone(status: OrderStatus) {
  switch (status) {
    case "placed":
      return "bg-amber-100 text-amber-800";
    case "confirmed":
      return "bg-sky-100 text-sky-800";
    case "packed":
      return "bg-indigo-100 text-indigo-800";
    case "shipped":
      return "bg-violet-100 text-violet-800";
    case "delivered":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function payTone(status: PaymentStatus) {
  if (status === "paid") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-rose-100 text-rose-800";
  if (status === "refunded") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-800";
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<StoreOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<OrderStatus>("placed");
  const [editPayment, setEditPayment] = useState<PaymentStatus>("pending");
  const [adminNote, setAdminNote] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/store/admin/orders?${params.toString()}`);
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to load store orders");
      }
      setOrders(json.data || []);
      setPages(json.pagination?.pages || 1);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load store orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, query]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openDetail = async (order: StoreOrder) => {
    setSelected(order);
    setEditStatus(order.status);
    setEditPayment(order.paymentStatus);
    setAdminNote(order.adminNote || "");
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/store/admin/orders/${order._id}`);
      const json = await response.json();
      if (response.ok && json.success && json.data) {
        setSelected(json.data);
        setEditStatus(json.data.status);
        setEditPayment(json.data.paymentStatus);
        setAdminNote(json.data.adminNote || "");
      }
    } catch {
      // keep list row data
    } finally {
      setDetailLoading(false);
    }
  };

  const saveStatus = async () => {
    if (!selected) return;
    if (editStatus === "cancelled" && selected.status !== "cancelled") {
      const ok = window.confirm(
        "Cancel this order? Stock will be restored for reserved items."
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/store/admin/orders/${selected._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          paymentStatus: editPayment,
          adminNote,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to update order");
      }
      setSelected(json.data);
      showToast(json.message || "Order updated");
      await loadOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Store Orders</h1>
            <p className="text-gray-600">
              Manage COD / online orders from the public store. Product catalog is managed under{" "}
              <a href="/products" className="font-medium text-spiritual-darkPurple underline">
                Products
              </a>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadOrders()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-spiritual-lightGold transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <p className="text-sm text-gray-500">Total matched</p>
            <p className="text-2xl font-bold text-spiritual-darkPurple mt-1">{total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <p className="text-sm text-gray-500">Page</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {page} / {pages}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <p className="text-sm text-gray-500">Fulfillment</p>
            <p className="text-sm text-gray-700 mt-2">
              Cancel restores stock automatically
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md flex flex-wrap items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <form
            className="relative flex-1 min-w-[220px] flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(searchInput.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search order #, name, phone, email"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-spiritual-purple text-white font-medium hover:bg-spiritual-darkPurple"
            >
              Search
            </button>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple outline-none"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
            {error}
          </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Order</th>
                  <th className="px-5 py-3 text-left font-semibold">Customer</th>
                  <th className="px-5 py-3 text-left font-semibold">Items</th>
                  <th className="px-5 py-3 text-left font-semibold">Total</th>
                  <th className="px-5 py-3 text-left font-semibold">Payment</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                      Loading store orders…
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No store orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => openDetail(order)}
                      className="hover:bg-spiritual-lightGold/60 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 font-semibold text-spiritual-darkPurple">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-800">{order.customer?.name}</div>
                        <div className="text-sm text-gray-500">{order.customer?.phone}</div>
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {order.items?.length || 0} item
                        {(order.items?.length || 0) === 1 ? "" : "s"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {money(order.pricing?.total)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          {order.paymentMethod}
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            payTone(order.paymentStatus)
                          )}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                            statusTone(order.status)
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b bg-white">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Store order</p>
                <h2 className="text-xl font-bold text-gray-900">{selected.orderNumber}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {detailLoading ? (
                <p className="text-sm text-gray-500">Loading details…</p>
              ) : null}

              <section className="rounded-xl border border-gray-200 p-4 space-y-2">
                <h3 className="font-semibold text-gray-800">Customer</h3>
                <p className="text-gray-900">{selected.customer?.name}</p>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" /> {selected.customer?.phone}
                </p>
                {selected.customer?.email ? (
                  <p className="text-sm text-gray-600">{selected.customer.email}</p>
                ) : null}
              </section>

              <section className="rounded-xl border border-gray-200 p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Shipping
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selected.shippingAddress?.line1}
                  {selected.shippingAddress?.line2 ? `, ${selected.shippingAddress.line2}` : ""}
                  <br />
                  {selected.shippingAddress?.city}, {selected.shippingAddress?.state}{" "}
                  {selected.shippingAddress?.pincode}
                  <br />
                  {selected.shippingAddress?.country || "India"}
                </p>
              </section>

              <section className="rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-semibold text-gray-800">Items</h3>
                {selected.items?.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || "base"}-${item._id || item.sku}`}
                    className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image.startsWith("http") ? item.image : item.image}
                        alt={item.title}
                        className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.title}</p>
                      {item.variantLabel ? (
                        <p className="text-xs text-gray-500">{item.variantLabel}</p>
                      ) : null}
                      <p className="text-sm text-gray-600 mt-1">
                        Qty {item.quantity} × {money(item.unitSalePrice)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">{money(item.lineTotal)}</p>
                  </div>
                ))}
                <div className="pt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{money(selected.pricing?.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Discount</span>
                    <span>-{money(selected.pricing?.discount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{money(selected.pricing?.shipping)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
                    <span>Total</span>
                    <span>{money(selected.pricing?.total)}</span>
                  </div>
                </div>
              </section>

              {selected.notes ? (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="font-semibold text-amber-900">Customer notes</h3>
                  <p className="text-sm text-amber-800 mt-1">{selected.notes}</p>
                </section>
              ) : null}

              <section className="rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-semibold text-gray-800">Update fulfillment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-sm text-gray-600 space-y-1">
                    <span>Order status</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-spiritual-purple"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-gray-600 space-y-1">
                    <span>Payment status</span>
                    <select
                      value={editPayment}
                      onChange={(e) => setEditPayment(e.target.value as PaymentStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-spiritual-purple"
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="failed">failed</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-gray-600 space-y-1">
                  <span>Admin note</span>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-spiritual-purple"
                    placeholder="Internal note for fulfillment team"
                  />
                </label>
                <p className="text-xs text-gray-500">
                  Placed {formatDate(selected.createdAt)} · Updated{" "}
                  {formatDate(selected.updatedAt)}
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveStatus}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white font-medium disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[60] rounded-lg bg-gray-900 text-white px-4 py-2 shadow-lg text-sm">
          {toast}
        </div>
      ) : null}
    </DashboardLayout>
  );
}
