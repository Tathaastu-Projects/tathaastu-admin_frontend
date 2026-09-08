"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const userGrowthData = [
  { month: "Jan", users: 1200 },
  { month: "Feb", users: 1900 },
  { month: "Mar", users: 3000 },
  { month: "Apr", users: 4500 },
  { month: "May", users: 6000 },
  { month: "Jun", users: 8500 },
];

const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 68000 },
  { month: "Apr", revenue: 75000 },
  { month: "May", revenue: 92000 },
  { month: "Jun", revenue: 110000 },
];

const courseSalesData = [
  { name: "Advanced Astrology", sales: 245 },
  { name: "Numerology Mastery", sales: 189 },
  { name: "Tarot Reading", sales: 312 },
  { name: "Palmistry Guide", sales: 156 },
];

const queryCategoryData = [
  { name: "Astrology", value: 35, color: "#9370DB" },
  { name: "Numerology", value: 25, color: "#D4AF37" },
  { name: "Tarot", value: 20, color: "#663399" },
  { name: "Palmistry", value: 15, color: "#9370DB" },
  { name: "Vastu", value: 5, color: "#D4AF37" },
];

export default function ReportsAnalyticsPage() {
  const handleExport = (format: string) => {
    alert(`Exporting report as ${format.toUpperCase()}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive insights and analytics</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport("pdf")}
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport("csv")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </motion.button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">User Growth Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#9370DB" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue Trend by Month</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#D4AF37" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Course Sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Course Sales Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseSalesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#663399" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Queries by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Queries by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={queryCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {queryCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

