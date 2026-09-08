"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopNavbar />
        <main className="pt-16 pb-20 min-h-screen">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

