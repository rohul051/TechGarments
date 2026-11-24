"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
} from "lucide-react";
import { recentPlatformActivity } from "@/lib/adminMockData";

export function RecentActivity() {
  const [filter, setFilter] = useState<string>("all");

  const filteredItems = recentPlatformActivity.filter((item) => {
    if (filter === "all") return true;
    if (filter === "verifications") return item.category === "verification";
    if (filter === "orders") return item.category === "order" || item.category === "rfq" || item.category === "quotation";
    if (filter === "alerts") return item.category === "complaint";
    return true;
  });

  return (
    <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-[#102B46]">Recent Administrative Activity</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of factory registrations, RFQ submissions, order milestones, and verification requests.
          </p>
        </div>

        {/* Segmented Filter */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            { id: "all", label: "All Activity" },
            { id: "verifications", label: "Verifications" },
            { id: "orders", label: "Orders & RFQs" },
            { id: "alerts", label: "Alerts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === tab.id
                  ? "bg-white text-[#102B46] shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-slate-100">
        {filteredItems.map((item) => {
          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-slate-50/70 px-2 rounded-xl transition-colors group"
            >
              <div className="flex items-start gap-3.5">
                {/* Avatar Badge */}
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 text-[#102B46] font-bold text-xs shrink-0 shadow-xs">
                  {item.avatarText || "TG"}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-[#102B46] group-hover:text-[#16A36A] transition-colors">
                      {item.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                        item.statusTone === "warning"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : item.statusTone === "danger"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : item.statusTone === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.subtitle}</p>
                </div>
              </div>

              {/* Timestamp & Action Button */}
              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                <span className="text-xs text-slate-400 whitespace-nowrap">{item.relativeTime}</span>
                {item.actionLabel && (
                  <Link
                    href={item.actionHref}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#102B46] bg-slate-100 hover:bg-[#16A36A] hover:text-white rounded-lg transition-all"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
