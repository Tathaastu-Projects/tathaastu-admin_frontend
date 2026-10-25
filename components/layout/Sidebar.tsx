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
  Images,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Website Customers", href: "/users", icon: Users },
  { name: "Store Orders", href: "/store-orders", icon: Store },
  { name: "Home Page", href: "/home-page", icon: Home },
  { name: "Category Banners", href: "/category-banners", icon: Images },
  { name: "Create Admin Account", href: "/admin-users", icon: UserPlus },
  { name: "Query Tracker", href: "/queries", icon: MessageSquare },
  { name: "PPT Builder", href: "/ppt-builder", icon: Presentation },
  { name: "Recommendations", href: "/recommendations", icon: Sparkles },
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
        <h1 className="text-2xl font-bold text-spiritual-darkPurple">Tathasstu</h1>
        <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
      </div>

      <nav className="p-4 space-y-1">
        <p className="px-4 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Website store
        </p>
        {menuItems.slice(0, 7).map((item) => {
          const Icon = item.icon;
          const path = pathname || "";
          const isActive = path === item.href || path.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white shadow-md"
                  : "text-gray-700 hover:bg-spiritual-lightGold",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}

        <p className="px-4 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Other tools
        </p>
        {menuItems.slice(7).map((item) => {
          const Icon = item.icon;
          const path = pathname || "";
          const isActive = path === item.href || path.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white shadow-md"
                  : "text-gray-700 hover:bg-spiritual-lightGold",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
