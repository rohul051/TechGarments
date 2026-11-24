"use client";

import { useState } from "react";
import {
  Calendar,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { QuickActions } from "@/components/admin/QuickActions";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { adminKPIData } from "@/lib/adminMockData";

export function DashboardContent() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("Just now");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 600);
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* 1. Header / Welcome Banner */}
      <div className="relative overflow-hidden p-6 md:p-8 bg-[#102B46] text-white rounded-3xl shadow-xl">
        {/* Decorative background ambient glows */}
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
              Global marketplace performance, compliance verification queues, live transaction flow, and capacity allocation across all connected manufacturing partners.
            </p>
          </div>

          {/* Sync & Date Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xs">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span suppressHydrationWarning>{currentDate}</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#16A36A] hover:bg-[#138a59] active:scale-95 rounded-xl transition-all shadow-md disabled:opacity-70 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Sync Data"}</span>
            </button>
          </div>
        </div>

        {/* Status sub-strip */}
        <div className="relative z-10 flex flex-wrap items-center gap-4 pt-6 mt-6 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">Live Services Active</span>
          </div>
          <span className="text-white/20">•</span>
          <div>Last synced: <span className="font-medium text-white">{lastRefreshed}</span></div>
          <span className="text-white/20">•</span>
          <div>Marketplace Status: <span className="text-emerald-400 font-medium">Healthy (99.98% uptime)</span></div>
        </div>
      </div>

      {/* 2. Primary 8 KPI Cards Grid (Section 5.1) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#102B46]">Platform Key Performance Indicators</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational metrics across user organizations, order pipelines, and transaction volume.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">8 Core Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminKPIData.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </div>

      {/* 3. Operational Quick Actions (Section 5.4) */}
      <QuickActions />

      {/* 4. Analytics & Volume Charts (Section 5.2) */}
      <AnalyticsCharts />

      {/* 5. Recent Platform Activity Feed (Section 5.3) */}
      <RecentActivity />

      {/* 6. Phase 1 Implementation Disclosure & Architecture Notice */}
      <div className="p-5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3.5 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">
            Phase 1 Overview Architecture Complete
          </p>
          <p className="text-blue-800 leading-relaxed">
            All 21 administrative sections, collapsible responsive sidebar, dynamic header, 8 high-level KPI cards, SVG volume trends, status distributions, operational shortcuts, and activity feeds are active. All mock data is centralized in <code className="px-1.5 py-0.5 rounded bg-blue-100 font-mono text-[11px]">lib/adminMockData.ts</code> and ready to bind to live Firestore collections and backend APIs in subsequent phases.
          </p>
        </div>
      </div>
    </div>
  );
}
