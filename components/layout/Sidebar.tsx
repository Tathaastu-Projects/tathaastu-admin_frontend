"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BookOpen,
  ShoppingCart,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  Sparkles,
  Package,
  Presentation,
  Store,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Query Tracker", href: "/queries", icon: MessageSquare },
  { name: "PPT Builder", href: "/ppt-builder", icon: Presentation },
  { name: "Recommendations", href: "/recommendations", icon: Sparkles },
  { name: "Products", href: "/products", icon: Package },
  { name: "Home Page", href: "/home-page", icon: Home },
  { name: "Store Orders", href: "/store-orders", icon: Store },
  { name: "Users", href: "/users", icon: Users },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Events & Content", href: "/events", icon: Calendar },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-spiritual-darkPurple">
          Tathasstu
        </h1>
        <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white shadow-md"
                    : "text-gray-700 hover:bg-spiritual-lightGold"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

