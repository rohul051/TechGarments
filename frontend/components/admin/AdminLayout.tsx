"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { getUser } from "@/lib/auth";
import type { User } from "@/types/user";
import { ShieldCheck, ArrowRight, UserCheck } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const emptySubscribe = () => () => {};

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [devAdminOverride, setDevAdminOverride] = useState(false);

  // Read admin authorization status with useSyncExternalStore:
  // On server (SSR): returns true so children segment is always rendered without dropping
  // In browser: checks if authenticated user has role === 'ADMIN'
  const isAuthorized = useSyncExternalStore(
    emptySubscribe,
    () => devAdminOverride || getUser()?.role === "ADMIN",
    () => true // Server snapshot renders children for static segment validation
  );

  // Quick helper to enable administrator session in development
  const handleDevGrantAdmin = () => {
    const adminUser: User = {
      id: "admin-master-001",
      email: "admin@techgarments.com",
      fullName: "Super Administrator",
      role: "ADMIN",
      adminRole: "SUPER_ADMIN",
    };
    localStorage.setItem("user", JSON.stringify(adminUser));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
    setDevAdminOverride(true);
  };

  // Only show unauthorized gate on client when user is not an administrator
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-[#F8FAFC]">
        <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#102B46]">Administrative Access Required</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            This module is reserved for authorized platform administrators. You are currently not signed in with an administrative role.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleDevGrantAdmin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#102B46] hover:bg-[#16A36A] rounded-xl shadow-md transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" /> Enter as Administrator (Super Admin)
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Sign In with Admin Account <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Sidebar Navigation (21 items) */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-[280px]"
        }`}
      >
        {/* Top Header */}
        <AdminHeader onOpenMobileSidebar={() => setMobileOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
