"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Users,
  Clock,
  CheckCircle,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Package,
  IndianRupee,
  ShoppingCart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { downloadSolutionPPT, type ExportPPTData } from "@/lib/pptExport";

type DashboardData = {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    clientsInQueue: number;
    totalClientsServed: number;
    clientsServedToday: number;
    ordersToday: number;
    newUsersToday: number;
    revenueToday: number;
    revenueAll: number;
    listedProducts: number;
    totalProducts: number;
    openOrders: number;
    activeCarts: number;
    wishlistItems: number;
  };
  weeklyOrders: { day: string; date: string; orders: number; revenue: number }[];
  ordersByStatus: { name: string; value: number; color: string }[];
  paymentSplit: { name: string; value: number; color: string }[];
  recentActivity: {
    id: string;
    action: string;
    user: string;
    detail?: string;
    time: string;
  }[];
  needsAttention: {
    id: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    status: string;
    paymentMethod: string;
    total: number;
    time: string;
  }[];
  generatedAt?: string;
};

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatCount(value?: number) {
  return Number(value || 0).toLocaleString("en-IN");
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedSolutions, setCompletedSolutions] = useState<
    Array<{
      id: string;
      clientName: string;
      queryType: string;
      solutionUpdatedAt: string;
      pptData: ExportPPTData;
    }>
  >([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analytics/dashboard", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load dashboard");
      }
      setData(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const loadCompletedSolutions = async () => {
      try {
        const response = await fetch("/api/queries/solutions/completed");
        if (!response.ok) return;
        const payload = await response.json();
        setCompletedSolutions(payload?.data || []);
      } catch {
        /* optional */
      }
    };
    void loadCompletedSolutions();
  }, [loadDashboard]);

  const handleDownload = async (solution: { id: string; pptData: ExportPPTData }) => {
    await downloadSolutionPPT(solution.id);
  };

  const kpis = data?.kpis;
  const kpiCards = [
    {
      label: "Total Users",
      value: formatCount(kpis?.totalUsers),
      hint: `${formatCount(kpis?.newUsersToday)} new today`,
      icon: Users,
      color: "from-spiritual-purple to-spiritual-darkPurple",
      href: "/users",
    },
    {
      label: "Clients in Queue",
      value: formatCount(kpis?.clientsInQueue),
      hint: `${formatCount(kpis?.openOrders)} open orders · ${formatCount(kpis?.activeCarts)} active carts`,
      icon: Clock,
      color: "from-yellow-400 to-orange-500",
      href: "/store-orders",
    },
    {
      label: "Total Clients Served",
      value: formatCount(kpis?.totalClientsServed),
      hint: `${money(kpis?.revenueAll)} total revenue`,
      icon: CheckCircle,
      color: "from-green-400 to-emerald-600",
      href: "/store-orders",
    },
    {
      label: "Clients Served Today",
      value: formatCount(kpis?.clientsServedToday),
      hint: `${formatCount(kpis?.ordersToday)} orders · ${money(kpis?.revenueToday)} today`,
      icon: CalendarIcon,
      color: "from-blue-400 to-cyan-600",
      href: "/store-orders",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">
              Live website store stats — users, carts, and orders update automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className={`bg-gradient-to-br ${kpi.color} rounded-xl p-6 text-white shadow-lg transition hover:opacity-95`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm mb-1">{kpi.label}</p>
                    <p className="text-3xl font-bold">
                      {loading && !data ? "…" : kpi.value}
                    </p>
                    <p className="mt-2 text-xs text-white/80">{kpi.hint}</p>
                  </div>
                  <Icon className="w-12 h-12 opacity-80" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
              <Package className="h-3.5 w-3.5" /> Listed products
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCount(kpis?.listedProducts)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
              <ShoppingCart className="h-3.5 w-3.5" /> Active carts
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCount(kpis?.activeCarts)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
              <IndianRupee className="h-3.5 w-3.5" /> Revenue today
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{money(kpis?.revenueToday)}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
              Wishlist items
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCount(kpis?.wishlistItems)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Orders by status</h2>
            {(data?.ordersByStatus || []).length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.ordersByStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {(data?.ordersByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-gray-500">
                No store orders yet — charts will fill after checkouts.
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Orders this week</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.weeklyOrders || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" name="Orders" fill="#9370DB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-gray-800">Needs attention</h2>
              <Link href="/store-orders" className="text-sm font-semibold text-spiritual-purple hover:underline">
                View all orders
              </Link>
            </div>
            <div className="space-y-3">
              {(data?.needsAttention || []).length === 0 ? (
                <p className="text-sm text-gray-500">No open orders in the queue.</p>
              ) : (
                (data?.needsAttention || []).map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-spiritual-lightGold/40 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-medium text-gray-800">{order.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {order.orderNumber} · {order.status} · {order.paymentMethod.toUpperCase()}
                        </p>
                        {order.phone ? (
                          <p className="text-xs text-gray-500 mt-1">{order.phone}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-spiritual-purple">
                          {money(order.total)}
                        </p>
                        <p className="text-xs text-gray-500">{order.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-gray-800">Recent activity</h2>
              <Link href="/users" className="text-sm font-semibold text-spiritual-purple hover:underline">
                Website customers
              </Link>
            </div>
            <div className="space-y-3">
              {(data?.recentActivity || []).length === 0 ? (
                <p className="text-sm text-gray-500">No recent registrations or orders yet.</p>
              ) : (
                (data?.recentActivity || []).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-spiritual-lightGold/40 transition-colors"
                  >
                    <div className="w-2 h-2 bg-spiritual-purple rounded-full mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                      <p className="text-xs text-gray-600">
                        {activity.user}
                        {activity.detail ? ` · ${activity.detail}` : ""} · {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Download Client PPTs</h2>
          {completedSolutions.length === 0 ? (
            <p className="text-sm text-gray-600">No completed solutions available yet.</p>
          ) : (
            <div className="space-y-3">
              {completedSolutions.map((solution) => (
                <div
                  key={solution.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-gray-800">{solution.clientName}</p>
                    <p className="text-xs text-gray-600">
                      {solution.id} · {solution.queryType} · Updated {solution.solutionUpdatedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDownload(solution)}
                    className="px-3 py-2 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PPT
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
