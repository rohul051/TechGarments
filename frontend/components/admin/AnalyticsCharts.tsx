"use client";

import { useState } from "react";
import {
  TrendingUp,
  Download,
} from "lucide-react";
import {
  transactionVolumeTrend,
  orderStatusDistribution,
  factoryVerificationStats,
} from "@/lib/adminMockData";

export function AnalyticsCharts() {
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D" | "1Y">("1Y");
  const [activeDataset, setActiveDataset] = useState<"volume" | "revenue">("volume");

  // Calculate maximum for SVG normalization
  const maxVolume = Math.max(...transactionVolumeTrend.map((d) => d.volume));

  // Generate smooth SVG polyline points
  const chartHeight = 200;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 20;

  const points = transactionVolumeTrend
    .map((item, index) => {
      const x = paddingX + (index / (transactionVolumeTrend.length - 1)) * (chartWidth - paddingX * 2);
      const val = activeDataset === "volume" ? item.volume : item.revenue * 20;
      const y = chartHeight - paddingY - (val / (maxVolume * 1.1)) * (chartHeight - paddingY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${paddingX},${chartHeight - paddingY} ${points} ${
    chartWidth - paddingX
  },${chartHeight - paddingY}`;

  const handleExportCSV = () => {
    const headers = "Month,Volume_USD_Thousands,Platform_Revenue_USD_Thousands,Orders_Count\n";
    const rows = transactionVolumeTrend
      .map((d) => `${d.month},$${d.volume}k,$${d.revenue}k,${d.ordersCount}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TechGarments_Analytics_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Main Chart Section: Platform Transaction Volume */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#102B46]">Platform Transaction Volume &amp; Growth</h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-200">
                Live Audited Data
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Monthly garment production orders finalized across buyers and factories.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Toggle */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveDataset("volume")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeDataset === "volume"
                    ? "bg-white text-[#102B46] font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                GMV Volume ($)
              </button>
              <button
                onClick={() => setActiveDataset("revenue")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeDataset === "revenue"
                    ? "bg-white text-[#102B46] font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Platform Fees
              </button>
            </div>

            {/* Timeframe selector */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium">
              {(["7D", "30D", "90D", "1Y"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    timeframe === t
                      ? "bg-white text-[#16A36A] font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
              title="Export Analytics CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Visual Responsive SVG Area Chart */}
        <div className="pt-6">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-extrabold text-[#102B46]">
              {activeDataset === "volume" ? "$14,280,000" : "$714,000"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <TrendingUp className="w-4 h-4" /> +18.7% vs previous period
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 md:h-64 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A36A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#16A36A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#CBD5E1" />

              {/* Area fill */}
              <polygon points={areaPoints} fill="url(#chartGradient)" />

              {/* Line */}
              <polyline
                fill="none"
                stroke="#16A36A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {/* Data Checkpoints */}
              {transactionVolumeTrend.map((item, index) => {
                const x = paddingX + (index / (transactionVolumeTrend.length - 1)) * (chartWidth - paddingX * 2);
                const val = activeDataset === "volume" ? item.volume : item.revenue * 20;
                const y = chartHeight - paddingY - (val / (maxVolume * 1.1)) * (chartHeight - paddingY * 2);

                return (
                  <g key={item.month} className="group cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-white stroke-[#102B46] stroke-2 group-hover:r-6 group-hover:stroke-[#16A36A] transition-all"
                    />
                    {/* Tooltip on hover */}
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-[#102B46] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ${item.volume}k
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-6 pt-2 text-[11px] font-semibold text-slate-400">
              {transactionVolumeTrend.map((d) => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Pipeline Status & Factory Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#102B46]">Order Production Status</h3>
              <p className="text-xs text-slate-500 mt-0.5">147 active orders in progress</p>
            </div>
            <span className="text-xs font-semibold text-[#16A36A] bg-[#16A36A]/10 px-2 py-0.5 rounded-full">
              98.4% On Schedule
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {orderStatusDistribution.map((item) => (
              <div key={item.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.status}</span>
                  <span className="text-slate-900">{item.count} orders ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Factory Verification Status */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#102B46]">Factory Compliance &amp; Verification</h3>
              <p className="text-xs text-slate-500 mt-0.5">348 onboarded manufacturing partners</p>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              23 Action Required
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {factoryVerificationStats.map((item) => (
              <div key={item.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.status}</span>
                  <span className="text-slate-900">{item.count} factories ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
