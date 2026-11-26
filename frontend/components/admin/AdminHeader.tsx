"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  Shield,
  User,
  Settings,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Command,
  FileCheck2,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { formatAdminRoleLabel } from "@/lib/adminSettings";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useAdminData } from "./AdminDataContext";

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const {
    hasMounted,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    factories,
    buyers,
    rfqs,
    quotes,
    orders,
  } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pathSegments = pathname.split("/").filter(Boolean);
  const currentTitle =
    pathSegments.length > 1
      ? pathSegments[1].charAt(0).toUpperCase() +
        pathSegments[1].slice(1).replace(/-/g, " ")
      : "Overview";

  const unreadCount = notifications.filter((n) => n.unread).length;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matches: { id: string; title: string; subtitle: string; href: string }[] = [];

    for (const f of factories) {
      if (`${f.companyName} ${f.fullName} ${f.email} ${f.country}`.toLowerCase().includes(q)) {
        matches.push({
          id: `sr-fac-${f.id}`,
          title: `Factory: ${f.companyName}`,
          subtitle: `${f.email} · ${f.country}`,
          href: "/admin/factories",
        });
      }
    }
    for (const b of buyers) {
      if (`${b.companyName} ${b.fullName} ${b.email} ${b.country}`.toLowerCase().includes(q)) {
        matches.push({
          id: `sr-buy-${b.id}`,
          title: `Buyer: ${b.companyName}`,
          subtitle: `${b.email} · ${b.buyerType}`,
          href: "/admin/buyers",
        });
      }
    }
    for (const r of rfqs) {
      if (`${r.id} ${r.title} ${r.buyerName}`.toLowerCase().includes(q)) {
        matches.push({
          id: `sr-rfq-${r.id}`,
          title: `RFQ ${r.id}: ${r.title}`,
          subtitle: `${r.buyerName} · ${r.quantityText} · ${r.status}`,
          href: "/admin/rfqs",
        });
      }
    }
    for (const qt of quotes) {
      if (`${qt.id} ${qt.factoryName} ${qt.buyerName} ${qt.product}`.toLowerCase().includes(q)) {
        matches.push({
          id: `sr-qt-${qt.id}`,
          title: `Quote ${qt.id}: ${qt.product}`,
          subtitle: `${qt.factoryName} -> ${qt.buyerName} · ${qt.currency} ${qt.pricePerUnit.toFixed(2)}`,
          href: "/admin/quotations",
        });
      }
    }
    for (const o of orders) {
      if (`${o.id} ${o.factoryName} ${o.buyerName} ${o.product}`.toLowerCase().includes(q)) {
        matches.push({
          id: `sr-ord-${o.id}`,
          title: `Order ${o.id}: ${o.product}`,
          subtitle: `${o.buyerName} -> ${o.factoryName} · ${o.status}`,
          href: "/admin/orders",
        });
      }
    }

    return matches.slice(0, 7);
  }, [searchQuery, factories, buyers, rfqs, quotes, orders]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[68px] px-4 md:px-8 bg-white border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500">
          <Link
            href="/admin/dashboard"
            className="font-medium text-slate-500 hover:text-[#102B46] transition-colors"
          >
            Admin
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-[#102B46]">{currentTitle}</span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search factories, buyers, RFQs, orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-12 text-xs md:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A36A]/20 focus:border-[#16A36A] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
            <Command className="w-3 h-3" /> K
          </kbd>

          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={result.href}
                    onClick={() => setSearchQuery("")}
                    className="block px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-xs font-semibold text-[#102B46] truncate">{result.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{result.subtitle}</p>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-500">
                  No matching records found for &ldquo;{searchQuery.trim()}&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Sync Active</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-600 hover:text-[#102B46] hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">
                    Platform Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-700 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead(notifications.map((n) => n.id))}
                    className="text-xs font-medium text-[#16A36A] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        setNotificationsOpen(false);
                      }}
                      className={`block px-4 py-3 hover:bg-slate-50 transition-colors ${
                        notif.unread ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="p-1.5 rounded-lg bg-[#102B46]/10 text-[#102B46] shrink-0 mt-0.5">
                          {notif.type === "verification" ? (
                            <FileCheck2 className="w-4 h-4 text-amber-600" />
                          ) : notif.type === "dispute" ? (
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {notif.description}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 inline-block">
                            {notif.time}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    No active platform alerts right now.
                  </div>
                )}
              </div>

              <div className="p-2.5 text-center bg-slate-50 border-t border-slate-200">
                <Link
                  href="/admin/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-[#102B46] hover:text-[#16A36A]"
                >
                  View all administrative notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div
              suppressHydrationWarning
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#102B46] text-white font-bold text-xs shrink-0 shadow-xs overflow-hidden"
            >
              {hasMounted && currentUser?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.fullName || "Admin"}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser?.fullName?.charAt(0).toUpperCase() || "A"
              )}
            </div>
            <div className="hidden sm:block">
              <span suppressHydrationWarning className="block text-xs font-semibold text-slate-800 leading-tight">
                {currentUser?.fullName || "Admin"}
              </span>
              <span suppressHydrationWarning className="block text-[10px] text-slate-500">
                {hasMounted ? formatAdminRoleLabel(currentUser?.adminRole) : "Super Admin"}
              </span>
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 admin-dropdown-menu">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p suppressHydrationWarning className="text-xs font-semibold text-slate-900">
                  {currentUser?.fullName || "Administrator"}
                </p>
                <p suppressHydrationWarning className="text-[11px] text-slate-500 truncate">
                  {currentUser?.email || "admin@techgarments.com"}
                </p>
                <span suppressHydrationWarning className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded">
                  <Shield className="w-2.5 h-2.5" /> {currentUser?.adminRole || "SUPER_ADMIN"}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/settings#admin-profile-settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Admin Profile</span>
                </Link>
                <Link
                  href="/admin/settings#admin-platform-settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Platform Configuration</span>
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>Public Marketplace</span>
                  </span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
