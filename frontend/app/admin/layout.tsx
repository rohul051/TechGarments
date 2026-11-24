import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Admin Portal | TechGarments Enterprise Administration",
  description: "Centralized administration portal for TechGarments garment manufacturing marketplace.",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
      <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#102B46] border-t-[#16A36A] rounded-full animate-spin" /></div>}>
        {children}
      </Suspense>
    </AdminLayout>
  );
}
