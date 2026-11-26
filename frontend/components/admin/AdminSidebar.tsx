"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  ShoppingBag,
  BadgeCheck,
  Boxes,
  FileText,
  FileSpreadsheet,
  FileSignature,
  PackageCheck,
  Activity,
  CheckCircle2,
  Truck,
  CreditCard,
  Scale,
  Star,
  Bot,
  BarChart3,
  Bell,
  Users,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shirt,
  Shield,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { formatAdminRoleLabel } from "@/lib/adminSettings";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { adminNavigationMeta, type AdminNavMeta } from "@/lib/adminNavigation";
import { useAdminData } from "./AdminDataContext";

export interface NavItemConfig extends AdminNavMeta {
  icon: LucideIcon;
}

const ADMIN_NAV_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  factories: Factory,
  buyers: ShoppingBag,
  verifications: BadgeCheck,
  resources: Boxes,
  rfqs: FileText,
  quotations: FileSpreadsheet,
  contracts: FileSignature,
  orders: PackageCheck,
  production: Activity,
  "quality-control": CheckCircle2,
  shipments: Truck,
  payments: CreditCard,
  disputes: Scale,
  reviews: Star,
  "ai-monitoring": Bot,
  analytics: BarChart3,
  notifications: Bell,
  administrators: Users,
  "audit-logs": History,
  settings: Settings,
};

export const adminNavigationItems: NavItemConfig[] = adminNavigationMeta.map((item) => ({
  ...item,
  icon: ADMIN_NAV_ICONS[item.id] ?? LayoutDashboard,
}));

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { sidebarBadges, hasMounted } = useAdminData();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#102B46] text-white border-r border-[#1A3E61] transition-all duration-300 ease-in-out ${collapsed ? "w-[76px]" : "w-[280px]"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-[68px] px-4 border-b border-[#1A3E61]">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#16A36A] text-white shadow-md shrink-0">
              <Shirt className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-tight text-white truncate">
                  TechGarments
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#16A36A]">
                  <Shield className="w-3 h-3" /> Admin Portal
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-[#1A3E61] lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-[#1A3E61] lg:flex items-center justify-center transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 custom-scrollbar">
          {adminNavigationItems.map((item) => {
            const Icon = item.icon;
            const badge = sidebarBadges[item.id] ?? item.badge;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                  ? "bg-[#16A36A] text-white font-semibold shadow-sm"
                  : "text-slate-300 hover:bg-[#1A3E61] hover:text-white"
                  } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`shrink-0 ${isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                    } ${collapsed ? "w-5 h-5" : "w-4 h-4"}`}
                />

                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${item.badgeTone === "danger"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : item.badgeTone === "warning"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : item.badgeTone === "success"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-[#1A3E61] text-slate-200"
                          }`}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Footer Section */}
        <div className="p-3 border-t border-[#1A3E61] bg-[#0B1D30]/70">
          <div
            className={`flex items-center gap-3 p-2 rounded-lg bg-[#102B46] border border-[#1A3E61] ${collapsed ? "justify-center p-2" : ""
              }`}
          >
            <div
              suppressHydrationWarning
              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-[#16A36A] to-emerald-400 text-white font-bold text-xs shrink-0 shadow-inner overflow-visible"
            >
              {hasMounted && currentUser?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.fullName || "Admin"}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                currentUser?.fullName?.charAt(0).toUpperCase() || "A"
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#102B46] rounded-full" />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p suppressHydrationWarning className="text-xs font-semibold text-white truncate">
                  {currentUser?.fullName || "Administrator"}
                </p>
                <span suppressHydrationWarning className="inline-block px-1.5 py-0.2 text-[10px] font-medium text-emerald-300 bg-emerald-950/60 rounded">
                  {hasMounted ? formatAdminRoleLabel(currentUser?.adminRole) : "Super Admin"}
                </span>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-300 rounded hover:bg-rose-950/30 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
