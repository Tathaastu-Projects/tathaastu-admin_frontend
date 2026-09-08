"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Download, Eye, Edit, Ban, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: "active" | "suspended";
  registeredDate: string;
}

const mockUsers: User[] = [
  { id: "U001", name: "John Doe", email: "john@example.com", mobile: "+1234567890", status: "active", registeredDate: "2024-12-01" },
  { id: "U002", name: "Jane Smith", email: "jane@example.com", mobile: "+1234567891", status: "active", registeredDate: "2024-11-15" },
  { id: "U003", name: "Mike Johnson", email: "mike@example.com", mobile: "+1234567892", status: "suspended", registeredDate: "2024-10-20" },
  { id: "U004", name: "Sarah Williams", email: "sarah@example.com", mobile: "+1234567893", status: "active", registeredDate: "2024-09-10" },
  { id: "U005", name: "David Brown", email: "david@example.com", mobile: "+1234567894", status: "active", registeredDate: "2024-08-05" },
];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mobile.includes(searchTerm)
  );

  const handleToggleStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u
      )
    );
  };

  const handleExport = () => {
    // Mock export functionality
    const csv = [
      ["Name", "Email", "Mobile", "Status", "Registered Date"],
      ...filteredUsers.map((u) => [u.name, u.email, u.mobile, u.status, u.registeredDate]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Users Management</h1>
            <p className="text-gray-600">Manage all platform users</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </motion.button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Mobile</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Registered Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-spiritual-lightGold transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                    <td className="px-6 py-4 text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 text-gray-700">{user.mobile}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{user.registeredDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === "active"
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={user.status === "active" ? "Suspend" : "Activate"}
                        >
                          {user.status === "active" ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
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

