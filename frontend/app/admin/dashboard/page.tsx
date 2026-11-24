import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardContent } from "./DashboardContent";

export const metadata: Metadata = {
  title: "Admin Overview Dashboard | TechGarments Administration",
  description: "Enterprise administration overview and platform control console for TechGarments.",
};

export default function AdminOverviewDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#102B46] border-t-[#16A36A] rounded-full animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
