"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import Footer from "./Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Real admin login requires a JWT — clear old mock sessions
    if (!isAuthenticated || !token) {
      if (isAuthenticated && !token) logout();
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, token, logout, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="hidden md:block w-64 border-r border-gray-200 bg-white" />
        <div className="flex-1 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-gray-200" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Redirecting to login…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopNavbar />
        <main className="pt-16 pb-20 min-h-screen">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
