"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, Clock, CheckCircle, Calendar as CalendarIcon, Download } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { downloadSolutionPPT, type ExportPPTData } from "@/lib/pptExport";

const kpiData = [
  { label: "Total Users", value: "12,543", icon: Users, color: "from-spiritual-purple to-spiritual-darkPurple" },
  { label: "Clients in Queue", value: "47", icon: Clock, color: "from-yellow-400 to-orange-500" },
  { label: "Total Clients Served", value: "8,921", icon: CheckCircle, color: "from-green-400 to-emerald-600" },
  { label: "Clients Served Today", value: "23", icon: CalendarIcon, color: "from-blue-400 to-cyan-600" },
];

const queryTypeData = [
  { name: "Astrology", value: 35, color: "#9370DB" },
  { name: "Numerology", value: 25, color: "#D4AF37" },
  { name: "Tarot", value: 20, color: "#663399" },
  { name: "Palmistry", value: 15, color: "#9370DB" },
  { name: "Vastu", value: 5, color: "#D4AF37" },
];

const weeklyData = [
  { day: "Mon", queries: 45 },
  { day: "Tue", queries: 52 },
  { day: "Wed", queries: 38 },
  { day: "Thu", queries: 61 },
  { day: "Fri", queries: 55 },
  { day: "Sat", queries: 72 },
  { day: "Sun", queries: 48 },
];

const recentActivity = [
  { id: 1, action: "New user registered", user: "John Doe", time: "2 mins ago" },
  { id: 2, action: "New order placed", user: "Jane Smith", time: "15 mins ago" },
  { id: 3, action: "Query updated", user: "Mike Johnson", time: "1 hour ago" },
  { id: 4, action: "Course created", user: "Admin", time: "2 hours ago" },
  { id: 5, action: "User suspended", user: "Sarah Williams", time: "3 hours ago" },
];

export default function DashboardPage() {
  const [completedSolutions, setCompletedSolutions] = useState<
    Array<{
      id: string;
      clientName: string;
      queryType: string;
      solutionUpdatedAt: string;
      pptData: ExportPPTData;
    }>
  >([]);

  useEffect(() => {
    const loadCompletedSolutions = async () => {
      try {
        const response = await fetch("/api/queries/solutions/completed");
        if (!response.ok) return;
        const payload = await response.json();
        setCompletedSolutions(payload?.data || []);
      } catch (error) {
        console.error("Failed to load completed solutions", error);
      }
    };

    loadCompletedSolutions();
  }, []);

  const handleDownload = async (solution: { id: string; pptData: ExportPPTData }) => {
    await downloadSolutionPPT(solution.id);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${kpi.color} rounded-xl p-6 text-white shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm mb-1">{kpi.label}</p>
                    <p className="text-3xl font-bold">{kpi.value}</p>
                  </div>
                  <Icon className="w-12 h-12 opacity-80" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Query Type Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Clients by Query Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={queryTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {queryTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weekly Query Volume */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Query Volume</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="queries" fill="#9370DB" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Calendar and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Meetings</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-spiritual-lightGold transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">Client Name {item}</p>
                      <p className="text-sm text-gray-600">Astrology Consultation</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-spiritual-purple">10:00 AM</p>
                      <p className="text-xs text-gray-500">Today</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">meet.google.com/abc-xyz</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-spiritual-lightGold transition-colors"
                >
                  <div className="w-2 h-2 bg-spiritual-purple rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Completed Solutions Download */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Download Client PPTs</h2>
          {completedSolutions.length === 0 ? (
            <p className="text-sm text-gray-600">No completed solutions available yet.</p>
          ) : (
            <div className="space-y-3">
              {completedSolutions.map((solution) => (
                <div key={solution.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{solution.clientName}</p>
                    <p className="text-xs text-gray-600">
                      {solution.id} • {solution.queryType} • Updated {solution.solutionUpdatedAt}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(solution)}
                    className="px-3 py-2 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PPT
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

