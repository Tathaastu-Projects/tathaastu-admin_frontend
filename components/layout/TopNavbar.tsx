"use client";

import { Bell, Settings, User, LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TopNavbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="bg-white shadow-md h-16 fixed top-0 left-64 right-0 z-10 flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/notifications">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-spiritual-lightGold transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </motion.button>
        </Link>

        <Link href="/settings">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-spiritual-lightGold transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-700" />
          </motion.button>
        </Link>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full hover:bg-spiritual-lightGold transition-colors"
        >
          <User className="w-5 h-5 text-gray-700" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-600" />
        </motion.button>

        <div className="ml-2">
          <p className="text-sm font-medium text-gray-700">
            {user?.name || "Admin"}
          </p>
        </div>
      </div>
    </nav>
  );
}

