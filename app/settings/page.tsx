"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { User, Mail, Shield, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your admin profile and site configuration</p>
        </div>

        {/* Admin Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-spiritual-purple" />
            <h2 className="text-2xl font-semibold text-gray-800">Admin Profile</h2>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.name || "Admin User"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || "admin@tathasstu.com"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <input
                type="text"
                defaultValue={user?.role || "admin"}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </motion.button>
          </form>
        </motion.div>

        {/* Site Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Site Configuration</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Base URL</label>
              <input
                type="url"
                defaultValue="https://api.tathasstu.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                defaultValue="Tathasstu"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Save className="w-5 h-5" />
              Save Configuration
            </motion.button>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

