"use client";

import {
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { QuickActions } from "@/components/admin/QuickActions";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { useAdminData } from "@/components/admin/AdminDataContext";

export function DashboardContent() {
  const {
    kpis,
    isRefreshing,
    lastRefreshed,
    refreshAll,
    buyers,
    factories,
    rfqs,
    quotes,
    orders,
  } = useAdminData();

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length;
  const pendingCount = orders.filter((o) => o.status === "PENDING_FACTORY_CONFIRMATION").length;

  return (
    <div className="space-y-8">
      {/* 1. Header / Welcome Banner */}
      <div className="relative overflow-hidden p-6 md:p-8 bg-[#102B46] text-white rounded-3xl shadow-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#16A36A]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#16A36A]" />
              <span>TechGarments Executive Administration Console</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Platform Overview &amp; Control
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Live marketplace visibility across registered buyers, manufacturing factories, RFQs, quotations, and order confirmations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xs">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span suppressHydrationWarning>{currentDate}</span>
            </div>

            <button
              onClick={() => void refreshAll()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#16A36A] hover:bg-[#138a59] active:scale-95 rounded-xl transition-all shadow-md disabled:opacity-70 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync Data"}</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-4 pt-6 mt-6 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">Live Sync Connected</span>
          </div>
          <span className="text-white/20">•</span>
          <div>Last synced: <span className="font-medium text-white">{lastRefreshed}</span></div>
          <span className="text-white/20">•</span>
          <div>
            Live Totals:{" "}
            <span className="text-emerald-300 font-medium">
              {buyers.length} buyers · {factories.length} factories · {rfqs.length} RFQs · {quotes.length} quotes · {confirmedCount} confirmed / {pendingCount} pending orders
            </span>
          </div>
        </div>
      </div>

      {/* 2. Primary 8 KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#102B46]">Platform Key Performance Indicators</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time metrics updated automatically when buyers or factories register, post RFQs, quote, or confirm orders.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">Live Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </div>

      {/* 3. Operational Quick Actions */}
      <QuickActions />

      {/* 4. Analytics & Volume Charts */}
      <AnalyticsCharts />

      {/* 5. Recent Platform Activity Feed */}
      <RecentActivity />

      {/* 6. Real-Time Sync Disclosure */}
      <div className="p-5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-start gap-3.5 text-xs text-emerald-950">
        <CheckCircle2 className="w-5 h-5 text-[#16A36A] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#102B46]">
            Synchronized with Buyer &amp; Factory Workspaces
          </p>
          <p className="text-slate-600 leading-relaxed">
            This console listens to Cloud Firestore, local account records, and cross-tab BroadcastChannels for buyer registrations, factory profiles/capacity updates, RFQ submissions, quotations, and order confirmations in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
