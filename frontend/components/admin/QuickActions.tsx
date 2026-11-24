"use client";

import Link from "next/link";
import {
  BadgeCheck,
  ShieldCheck,
  AlertTriangle,
  Scale,
  FileSpreadsheet,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { adminQuickActions } from "@/lib/adminMockData";

const quickActionIcons: Record<string, LucideIcon> = {
  BadgeCheck,
  ShieldCheck,
  AlertTriangle,
  Scale,
  FileSpreadsheet,
};

export function QuickActions() {
  return (
    <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-[#102B46]">Administrative Quick Actions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct operational shortcuts to priority queue management workflows.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {adminQuickActions.map((action) => {
          const Icon = quickActionIcons[action.iconName] || BadgeCheck;

          return (
            <Link
              key={action.id}
              href={action.href}
              className="group relative flex flex-col justify-between p-4 bg-slate-50 hover:bg-[#102B46] border border-slate-200/80 hover:border-[#102B46] rounded-xl transition-all duration-200 shadow-xs hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white group-hover:bg-[#16A36A] text-[#102B46] group-hover:text-white shadow-xs transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  {action.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 group-hover:bg-amber-400 group-hover:text-slate-900 rounded-full">
                      {action.badge}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 group-hover:text-white transition-colors">
                  {action.title}
                </h4>
                <p className="text-[11px] text-slate-500 group-hover:text-slate-300 mt-1 line-clamp-2">
                  {action.description}
                </p>
              </div>

              <div className="flex items-center justify-end pt-3 mt-2 text-xs font-semibold text-[#16A36A] group-hover:text-emerald-300">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
