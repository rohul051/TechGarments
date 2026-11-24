"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Users,
  Factory,
  ShoppingBag,
  FileCheck2,
  FileText,
  Clock3,
  CheckCircle2,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import type { KPIStat } from "@/types/admin.types";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Factory,
  ShoppingBag,
  FileCheck2,
  FileText,
  Clock3,
  CheckCircle2,
  DollarSign,
};

interface StatCardProps {
  stat: KPIStat;
}

export function StatCard({ stat }: StatCardProps) {
  const Icon = iconMap[stat.iconName] || Users;

  const colorStyles = {
    navy: "bg-[#102B46]/10 text-[#102B46] border-[#102B46]/20",
    green: "bg-[#16A36A]/10 text-[#16A36A] border-[#16A36A]/20",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  }[stat.accentColor];

  return (
    <Link
      href={stat.href}
      className="group relative flex flex-col justify-between p-5 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-[#16A36A]/40 transition-all duration-200 overflow-hidden"
    >
      {/* Top row: Icon and Trend indicator */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div
          className={`flex items-center justify-center w-11 h-11 rounded-xl border ${colorStyles} transition-transform group-hover:scale-105 duration-200`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-1.5">
          {stat.trend === "up" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              {stat.trendPercent}
            </span>
          )}
          {stat.trend === "down" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/60 rounded-full">
              <TrendingDown className="w-3.5 h-3.5" />
              {stat.trendPercent}
            </span>
          )}
          {stat.trend === "neutral" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-full">
              {stat.trendPercent}
            </span>
          )}
        </div>
      </div>

      {/* Middle row: Value and Title */}
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-[#102B46] group-hover:text-[#16A36A] transition-colors">
          {stat.value}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
          {stat.title}
        </p>
      </div>

      {/* Bottom row: Subtext comparison & Action arrow */}
      <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500">
        <span className="truncate pr-2">{stat.comparisonText}</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#16A36A] group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </Link>
  );
}
