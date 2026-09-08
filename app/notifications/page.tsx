"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Send, Bell } from "lucide-react";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  audience: string;
  sentAt: string;
  status: "sent" | "pending";
}

const mockNotifications: Notification[] = [
  {
    id: "N001",
    title: "New Course Available",
    message: "Check out our new Advanced Astrology course!",
    audience: "All Users",
    sentAt: "2025-01-15 10:30 AM",
    status: "sent",
  },
  {
    id: "N002",
    title: "Weekly Meditation Session",
    message: "Join us this Friday for a guided meditation session.",
    audience: "Premium Users",
    sentAt: "2025-01-14 2:15 PM",
    status: "sent",
  },
];

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    audience: "All Users",
  });

  const handleSend = () => {
    const newNotification: Notification = {
      id: `N${String(notifications.length + 1).padStart(3, "0")}`,
      title: formData.title,
      message: formData.message,
      audience: formData.audience,
      sentAt: new Date().toLocaleString(),
      status: "sent",
    };
    setNotifications([newNotification, ...notifications]);
    setFormData({ title: "", message: "", audience: "All Users" });
    setShowModal(false);
    alert("Notification sent successfully!");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Notifications Center</h1>
            <p className="text-gray-600">Manage and send notifications to users</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Create Notification
          </motion.button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-5 h-5 text-spiritual-purple" />
                    <h3 className="text-xl font-semibold text-gray-800">{notification.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        notification.status === "sent"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {notification.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{notification.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Audience: {notification.audience}</span>
                    <span>•</span>
                    <span>Sent: {notification.sentAt}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Notification</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  >
                    <option value="All Users">All Users</option>
                    <option value="Premium Users">Premium Users</option>
                    <option value="New Users">New Users</option>
                    <option value="Active Users">Active Users</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Notification
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

