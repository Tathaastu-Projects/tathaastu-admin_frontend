"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { CategoryBannersSection } from "@/components/homepage/CategoryBannersSection";

export default function CategoryBannersPage() {
  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-8rem)] bg-brand-softCream p-6 md:p-8">
        <CategoryBannersSection />
      </div>
    </DashboardLayout>
  );
}
