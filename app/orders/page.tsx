"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Download, Filter } from "lucide-react";
import { motion } from "framer-motion";

interface Order {
  id: string;
  user: string;
  course: string;
  amount: number;
  status: "pending" | "completed" | "refunded";
  date: string;
}

const mockOrders: Order[] = [
  { id: "ORD001", user: "John Doe", course: "Advanced Astrology", amount: 2999, status: "completed", date: "2025-01-15" },
  { id: "ORD002", user: "Jane Smith", course: "Numerology Mastery", amount: 1999, status: "pending", date: "2025-01-14" },
  { id: "ORD003", user: "Mike Johnson", course: "Tarot Reading Basics", amount: 1499, status: "completed", date: "2025-01-13" },
  { id: "ORD004", user: "Sarah Williams", course: "Palmistry Guide", amount: 1799, status: "refunded", date: "2025-01-12" },
  { id: "ORD005", user: "David Brown", course: "Advanced Astrology", amount: 2999, status: "completed", date: "2025-01-11" },
];

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    // Mock invoice download
    alert(`Downloading invoice for ${orderId}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Orders Management</h1>
            <p className="text-gray-600">View and manage all course orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-md flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Order ID</th>
                  <th className="px-6 py-4 text-left font-semibold">User</th>
                  <th className="px-6 py-4 text-left font-semibold">Course</th>
                  <th className="px-6 py-4 text-left font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-spiritual-lightGold transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{order.id}</td>
                    <td className="px-6 py-4 text-gray-700">{order.user}</td>
                    <td className="px-6 py-4 text-gray-700">{order.course}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">₹{order.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{order.date}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

