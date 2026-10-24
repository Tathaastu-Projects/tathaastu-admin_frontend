"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search,
  Download,
  Ban,
  CheckCircle,
  RefreshCw,
  Eye,
  X,
  Package,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Clock,
  ShoppingCart,
  Heart,
} from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: "active" | "suspended";
  registeredDate: string;
  createdAt?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  lastOrderNumber?: string;
  cartItemCount?: number;
  wishlistCount?: number;
  addresses?: Address[];
};

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  label?: string;
};

type CartItem = {
  productId: string;
  slug?: string;
  title: string;
  image?: string;
  variantLabel?: string;
  unitSalePrice: number;
  unitMrp?: number;
  qty: number;
};

type WishlistItem = {
  id: string;
  productId: string;
  productSlug?: string;
  title: string;
  image?: string;
  salePrice: number;
  createdAt?: string;
};

type OrderItem = {
  title: string;
  quantity: number;
  unitSalePrice: number;
  lineTotal: number;
  variantLabel?: string;
  sku?: string;
  image?: string;
};

type OrderHistory = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  couponCode?: string;
  notes?: string;
  adminNote?: string;
  shippingAddressText: string;
  items: OrderItem[];
  pricing: { subtotal: number; discount: number; shipping: number; total: number };
  razorpayPaymentId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type UserDetail = UserRow & {
  history?: {
    cart: { items: CartItem[]; itemCount: number; total: number; updatedAt?: string | null };
    wishlist: WishlistItem[];
    orders: OrderHistory[];
    summary: {
      orderCount: number;
      totalSpent: number;
      lastOrderAt?: string | null;
      deliveredCount: number;
      cancelledCount: number;
      pendingPaymentCount: number;
      cartItemCount: number;
      wishlistCount: number;
    };
  };
};

type Tab = "orders" | "cart" | "wishlist" | "profile";

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function badgeClass(kind: "status" | "pay" | "order", value: string) {
  if (kind === "status") {
    return value === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
  }
  if (kind === "pay") {
    if (value === "paid") return "bg-emerald-50 text-emerald-700";
    if (value === "failed") return "bg-rose-50 text-rose-700";
    if (value === "refunded") return "bg-slate-100 text-slate-700";
    return "bg-amber-50 text-amber-800";
  }
  if (value === "delivered") return "bg-emerald-50 text-emerald-700";
  if (value === "cancelled") return "bg-rose-50 text-rose-700";
  if (value === "shipped") return "bg-violet-50 text-violet-700";
  return "bg-sky-50 text-sky-800";
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const load = useCallback(async (search = "") => {
    setLoading(true);
    setError("");
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const response = await fetch(`/api/users${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load website customers");
      }
      setUsers(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load website customers");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.name} ${u.email} ${u.mobile} ${u.lastOrderNumber || ""}`.toLowerCase().includes(q),
    );
  }, [users, searchTerm]);

  const openDetail = async (id: string, initialTab: Tab = "orders") => {
    setDetailLoading(true);
    setError("");
    setTab(initialTab);
    setOpenOrderId(null);
    try {
      const response = await fetch(`/api/users/${id}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load customer details");
      }
      setSelected(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setSavingId(id);
    setError("");
    try {
      const response = await fetch(`/api/users/${id}/toggle-status`, { method: "PATCH" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update status");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: payload.data.status } : u)),
      );
      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status: payload.data.status } : prev));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSavingId("");
    }
  };

  const handleExport = () => {
    const csv = [
      [
        "Name",
        "Email",
        "Mobile",
        "Status",
        "Registered",
        "Cart Items",
        "Wishlist",
        "Orders",
        "Total Spent",
        "Last Order",
        "Last Order At",
      ],
      ...filteredUsers.map((u) => [
        u.name,
        u.email,
        u.mobile,
        u.status,
        u.registeredDate,
        String(u.cartItemCount || 0),
        String(u.wishlistCount || 0),
        String(u.orderCount || 0),
        String(u.totalSpent || 0),
        u.lastOrderNumber || "",
        u.lastOrderAt || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website-customers.csv";
    a.click();
  };

  const summary = selected?.history?.summary;
  const orders = selected?.history?.orders || [];
  const cart = selected?.history?.cart;
  const wishlist = selected?.history?.wishlist || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Website Customers</h1>
            <p className="text-gray-600 max-w-2xl">
              Everyone who registers on the Abhimantrit website. Open a customer to see their
              current cart, wishlist, and every order (date, price, address, payment).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load(searchTerm)}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-violet-700">Registered users</p>
            <p className="mt-1 text-2xl font-bold text-violet-950">{users.length}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-amber-700">With items in cart</p>
            <p className="mt-1 text-2xl font-bold text-amber-950">
              {users.filter((u) => (u.cartItemCount || 0) > 0).length}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-700">Customers with orders</p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">
              {users.filter((u) => (u.orderCount || 0) > 0).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search name, email, mobile, or order number…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-spiritual-purple/30"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Registered</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Cart</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Wishlist</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Orders / Spent</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                      Loading website customers…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                      No registered customers yet. When someone creates an account on the website,
                      they appear here.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.mobile || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDateTime(user.createdAt || user.registeredDate)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetail(user.id, "cart")}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:underline"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {user.cartItemCount || 0}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetail(user.id, "wishlist")}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700 hover:underline"
                        >
                          <Heart className="h-3.5 w-3.5" />
                          {user.wishlistCount || 0}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          type="button"
                          onClick={() => void openDetail(user.id, "orders")}
                          className="text-left hover:underline"
                        >
                          <p className="font-semibold text-gray-800">{user.orderCount || 0} orders</p>
                          <p className="text-gray-500">{money(user.totalSpent)}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass("status", user.status)}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void openDetail(user.id, "orders")}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Full details
                          </button>
                          <button
                            type="button"
                            disabled={savingId === user.id}
                            onClick={() => void handleToggleStatus(user.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-50"
                          >
                            {user.status === "active" ? (
                              <>
                                <Ban className="w-3.5 h-3.5" /> Suspend
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" /> Activate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(selected || detailLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <button
            type="button"
            className="flex-1 cursor-default"
            aria-label="Close"
            onClick={() => setSelected(null)}
          />
          <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {detailLoading ? "Loading…" : selected?.name}
                  </h2>
                  {!detailLoading && selected ? (
                    <p className="mt-1 text-sm text-gray-500">
                      Registered {formatDateTime(selected.createdAt || selected.registeredDate)}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!detailLoading && selected ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(
                    [
                      ["orders", `Orders (${summary?.orderCount || 0})`],
                      ["cart", `Cart (${summary?.cartItemCount || 0})`],
                      ["wishlist", `Wishlist (${summary?.wishlistCount || 0})`],
                      ["profile", "Profile"],
                    ] as [Tab, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        tab === id
                          ? "bg-spiritual-purple text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {detailLoading || !selected ? (
              <div className="space-y-3 p-5">
                <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
              </div>
            ) : (
              <div className="space-y-5 p-5">
                {tab === "profile" ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                        <p className="inline-flex items-center gap-1.5 text-gray-500">
                          <Mail className="h-3.5 w-3.5" /> Email
                        </p>
                        <p className="mt-1 font-medium text-gray-800">{selected.email || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                        <p className="inline-flex items-center gap-1.5 text-gray-500">
                          <Phone className="h-3.5 w-3.5" /> Phone
                        </p>
                        <p className="mt-1 font-medium text-gray-800">{selected.mobile || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                        <p className="inline-flex items-center gap-1.5 text-gray-500">
                          <Clock className="h-3.5 w-3.5" /> Registered
                        </p>
                        <p className="mt-1 font-medium text-gray-800">
                          {formatDateTime(selected.createdAt || selected.registeredDate)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                        <p className="text-gray-500">Account status</p>
                        <p className="mt-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass("status", selected.status)}`}
                          >
                            {selected.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    {selected.addresses?.length ? (
                      <div>
                        <h3 className="mb-2 font-semibold text-gray-800">Saved addresses</h3>
                        {selected.addresses.map((addr, index) => (
                          <div
                            key={`${addr.line1}-${index}`}
                            className="mb-2 rounded-xl border border-gray-100 px-3 py-2 text-sm text-gray-700"
                          >
                            <p className="inline-flex items-center gap-1.5 font-medium">
                              <MapPin className="h-3.5 w-3.5" />
                              {addr.label || `Address ${index + 1}`}
                            </p>
                            <p className="mt-1 text-gray-600">
                              {[
                                addr.line1,
                                addr.line2,
                                addr.city,
                                addr.state,
                                addr.pincode,
                                addr.country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No saved addresses on the account yet.</p>
                    )}
                  </div>
                ) : null}

                {tab === "cart" ? (
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="inline-flex items-center gap-2 font-semibold text-gray-800">
                        <ShoppingCart className="h-4 w-4" />
                        Current cart
                      </h3>
                      <p className="text-sm font-bold text-gray-900">{money(cart?.total)}</p>
                    </div>
                    <p className="mb-3 text-xs text-gray-500">
                      Updated {formatDateTime(cart?.updatedAt)} · Live bag on the website
                    </p>
                    {!cart?.items?.length ? (
                      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                        Cart is empty right now.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {cart.items.map((item, index) => (
                          <li
                            key={`${item.productId}-${index}`}
                            className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3"
                          >
                            <div className="flex gap-3">
                              {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image}
                                  alt=""
                                  className="h-14 w-14 rounded-lg object-cover bg-gray-100"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-lg bg-gray-100" />
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-500">
                                  Qty {item.qty}
                                  {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-gray-800">
                              {money(item.unitSalePrice * item.qty)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ) : null}

                {tab === "wishlist" ? (
                  <section>
                    <h3 className="mb-3 inline-flex items-center gap-2 font-semibold text-gray-800">
                      <Heart className="h-4 w-4" />
                      Wishlist
                    </h3>
                    {!wishlist.length ? (
                      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                        No wishlist items.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {wishlist.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 px-3 py-3"
                          >
                            <div className="flex gap-3">
                              {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image}
                                  alt=""
                                  className="h-14 w-14 rounded-lg object-cover bg-gray-100"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-lg bg-gray-100" />
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-500">
                                  Added {formatDateTime(item.createdAt)}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-gray-800">{money(item.salePrice)}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ) : null}

                {tab === "orders" ? (
                  <section>
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                        <p className="text-xs text-violet-700">Orders</p>
                        <p className="mt-1 text-xl font-bold text-violet-900">
                          {summary?.orderCount || 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                        <p className="text-xs text-emerald-700">Total spent</p>
                        <p className="mt-1 text-xl font-bold text-emerald-900">
                          {money(summary?.totalSpent)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                        <p className="text-xs text-sky-700">Delivered</p>
                        <p className="mt-1 text-xl font-bold text-sky-900">
                          {summary?.deliveredCount || 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                        <p className="text-xs text-amber-700">Pending pay</p>
                        <p className="mt-1 text-xl font-bold text-amber-900">
                          {summary?.pendingPaymentCount || 0}
                        </p>
                      </div>
                    </div>

                    <h3 className="mb-3 inline-flex items-center gap-2 font-semibold text-gray-800">
                      <Package className="h-4 w-4" />
                      Purchase history
                    </h3>

                    {!orders.length ? (
                      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                        No purchases yet. When they checkout, full order details show here.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => {
                          const open = openOrderId === order.id;
                          return (
                            <article
                              key={order.id}
                              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                            >
                              <button
                                type="button"
                                onClick={() => setOpenOrderId(open ? null : order.id)}
                                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                              >
                                <div>
                                  <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {formatDateTime(order.createdAt)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">
                                    {money(order.pricing.total)}
                                  </p>
                                  <div className="mt-1 flex flex-wrap justify-end gap-1">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeClass("order", order.status)}`}
                                    >
                                      {order.status}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeClass("pay", order.paymentStatus)}`}
                                    >
                                      {order.paymentStatus}
                                    </span>
                                  </div>
                                </div>
                              </button>

                              {open ? (
                                <div className="space-y-3 border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-sm">
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <p className="inline-flex items-center gap-1.5 text-gray-700">
                                      <CreditCard className="h-3.5 w-3.5" />
                                      Payment:{" "}
                                      <strong className="uppercase">
                                        {order.paymentMethod || "—"}
                                      </strong>
                                    </p>
                                    <p className="text-gray-700">
                                      Updated: {formatDateTime(order.updatedAt)}
                                    </p>
                                    {order.couponCode ? (
                                      <p className="text-gray-700">Coupon: {order.couponCode}</p>
                                    ) : null}
                                    {order.razorpayPaymentId ? (
                                      <p className="text-gray-700">
                                        Razorpay: {order.razorpayPaymentId}
                                      </p>
                                    ) : null}
                                  </div>

                                  <div>
                                    <p className="inline-flex items-center gap-1.5 font-medium text-gray-800">
                                      <MapPin className="h-3.5 w-3.5" />
                                      Shipping address
                                    </p>
                                    <p className="mt-1 text-gray-600">
                                      {order.shippingAddressText || "—"}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="mb-2 font-medium text-gray-800">Items bought</p>
                                    <ul className="space-y-2">
                                      {order.items.map((item, index) => (
                                        <li
                                          key={`${order.id}-${index}`}
                                          className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
                                        >
                                          <div>
                                            <p className="font-medium text-gray-800">{item.title}</p>
                                            <p className="text-xs text-gray-500">
                                              Qty {item.quantity}
                                              {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                                            </p>
                                          </div>
                                          <p className="font-semibold text-gray-800">
                                            {money(item.lineTotal)}
                                          </p>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="space-y-1 rounded-lg border border-gray-100 bg-white px-3 py-2">
                                    <div className="flex justify-between text-gray-600">
                                      <span>Subtotal</span>
                                      <span>{money(order.pricing.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                      <span>Discount</span>
                                      <span>-{money(order.pricing.discount)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                      <span>Shipping</span>
                                      <span>{money(order.pricing.shipping)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-gray-900">
                                      <span>Total</span>
                                      <span>{money(order.pricing.total)}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ) : null}
              </div>
            )}
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
}
