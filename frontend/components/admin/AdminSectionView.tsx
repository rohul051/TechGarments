"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Factory,
  FileText,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useAdminData } from "./AdminDataContext";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { RecentActivity } from "./RecentActivity";
import { AdminSettingsPage } from "./AdminSettingsPage";
import { adminNavigationMeta } from "@/lib/adminNavigation";

export function AdminSectionView({ section }: { section: string }) {
  const {
    factories,
    buyers,
    users,
    rfqs,
    quotes,
    orders,
    notifications,
    totalOrderValue,
    toggleFactoryVerification,
    markNotificationRead,
    markAllNotificationsRead,
    refreshAll,
    isRefreshing,
  } = useAdminData();

  const [queryText, setQueryText] = useState("");
  const navMeta = adminNavigationMeta.find((item) => item.id === section);
  const title = navMeta?.label || "Administration Section";
  const q = queryText.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A36A] hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-[#102B46]">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Live synchronized data reflecting current Buyer and Factory platform state.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {section !== "settings" && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Filter records..."
                className="h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-[#16A36A]"
              />
            </div>
          )}
          <button
            onClick={() => void refreshAll()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white bg-[#102B46] hover:bg-[#16A36A] rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {(section === "factories" || section === "verifications" || section === "resources") && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102B46] flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#16A36A]" />
              {section === "verifications"
                ? `Factory Compliance & Verification Queue (${factories.length})`
                : `Registered Factories (${factories.length})`}
            </h2>
            <span className="text-xs text-slate-500">
              {factories.filter((f) => f.verified).length} verified ·{" "}
              {factories.reduce((s, f) => s + f.monthlyCapacity, 0).toLocaleString()} pcs/mo total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Factory</th>
                  <th className="px-5 py-3">Representative</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Capacity / MOQ</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {factories
                  .filter((f) =>
                    !q || `${f.companyName} ${f.fullName} ${f.email} ${f.country} ${f.city}`.toLowerCase().includes(q),
                  )
                  .map((factory) => {
                    const key = factory.email || factory.id;
                    return (
                      <tr key={key} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[#102B46]">{factory.companyName}</div>
                          <div className="text-[11px] text-slate-400">{factory.email}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{factory.fullName}</td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {[factory.city, factory.country].filter(Boolean).join(", ") || "Not specified"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          {factory.monthlyCapacity ? `${factory.monthlyCapacity.toLocaleString()} pcs` : "—"} /{" "}
                          {factory.moq ? `${factory.moq} MOQ` : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {factory.products.slice(0, 3).join(", ") || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              factory.verified
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {factory.verified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => toggleFactoryVerification(key)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                              factory.verified
                                ? "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                                : "bg-[#16A36A] text-white hover:bg-[#138a59]"
                            }`}
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            {factory.verified ? "Revoke" : "Verify"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {factories.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      No factories registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "buyers" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102B46] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#16A36A]" />
              Registered Buyers ({buyers.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Brand / Buyer</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3">RFQs</th>
                  <th className="px-5 py-3">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buyers
                  .filter((b) =>
                    !q || `${b.companyName} ${b.fullName} ${b.email} ${b.country}`.toLowerCase().includes(q),
                  )
                  .map((buyer) => {
                    const buyerRfqs = rfqs.filter(
                      (r) => r.buyerEmail === buyer.email || r.buyerId === buyer.id,
                    ).length;
                    const buyerOrders = orders.filter(
                      (o) => o.buyerEmail === buyer.email || o.buyerId === buyer.id,
                    ).length;
                    return (
                      <tr key={buyer.email || buyer.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[#102B46]">{buyer.companyName}</div>
                          <div className="text-[11px] text-slate-400">{buyer.email}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{buyer.fullName}</td>
                        <td className="px-5 py-3.5 text-slate-600">{buyer.buyerType}</td>
                        <td className="px-5 py-3.5 text-slate-600">{buyer.country}</td>
                        <td className="px-5 py-3.5 font-semibold text-[#102B46]">{buyerRfqs}</td>
                        <td className="px-5 py-3.5 font-semibold text-[#16A36A]">{buyerOrders}</td>
                      </tr>
                    );
                  })}
                {buyers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No buyers registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "rfqs" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102B46] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#16A36A]" />
              Buyer Production Requests / RFQs ({rfqs.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">RFQ ID</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Deadline</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfqs
                  .filter((r) => !q || `${r.id} ${r.title} ${r.buyerName} ${r.status}`.toLowerCase().includes(q))
                  .map((rfq) => (
                    <tr key={rfq.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-[#102B46]">{rfq.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{rfq.title}</td>
                      <td className="px-5 py-3.5 text-slate-600">{rfq.buyerName}</td>
                      <td className="px-5 py-3.5 text-slate-700">{rfq.quantityText}</td>
                      <td className="px-5 py-3.5 text-slate-600">{rfq.deadline}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {rfq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                {rfqs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No production requests submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "quotations" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102B46]">
              Factory Quotations ({quotes.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Quote / RFQ</th>
                  <th className="px-5 py-3">Factory</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3">Lead Time</th>
                  <th className="px-5 py-3">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes
                  .filter((qt) =>
                    !q || `${qt.id} ${qt.factoryName} ${qt.buyerName} ${qt.product}`.toLowerCase().includes(q),
                  )
                  .map((quote) => {
                    const order = orders.find((o) => o.quoteId === quote.id && o.status !== "CANCELLED");
                    const label = order?.status === "CONFIRMED"
                      ? "Confirmed"
                      : order
                        ? "Order Requested"
                        : "Sent / Pending";
                    return (
                      <tr key={quote.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="font-mono text-[11px] font-semibold text-[#102B46]">{quote.id}</div>
                          <div className="text-[11px] text-slate-400">{quote.requestId}</div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{quote.factoryName}</td>
                        <td className="px-5 py-3.5 text-slate-600">{quote.buyerName}</td>
                        <td className="px-5 py-3.5 text-slate-700">{quote.product}</td>
                        <td className="px-5 py-3.5 font-semibold text-[#102B46]">
                          {quote.currency} {quote.pricePerUnit.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{quote.leadTime}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {quotes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      No quotations sent yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(section === "orders" ||
        section === "production" ||
        section === "contracts" ||
        section === "quality-control" ||
        section === "shipments" ||
        section === "payments") && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102B46] flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#16A36A]" />
              Platform Orders &amp; Value ({orders.length})
            </h2>
            <span className="text-xs font-semibold text-[#16A36A]">
              Total Active Value: ${totalOrderValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Factory</th>
                  <th className="px-5 py-3">Product &amp; Qty</th>
                  <th className="px-5 py-3">Total Value</th>
                  <th className="px-5 py-3">Delivery Target</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders
                  .filter((o) => !q || `${o.id} ${o.buyerName} ${o.factoryName} ${o.product}`.toLowerCase().includes(q))
                  .map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-[11px] font-semibold text-[#102B46]">{order.id}</div>
                        <div className="text-[11px] text-slate-400">{order.requestId}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{order.buyerName}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{order.factoryName}</td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {order.product} · {order.quantityText}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#102B46]">
                        {order.currency} {order.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{order.targetDeliveryDate}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            order.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : order.status === "PENDING_FACTORY_CONFIRMATION"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {order.status === "CONFIRMED" ? (
                            <><CheckCircle2 className="w-3 h-3" /> Confirmed</>
                          ) : order.status === "PENDING_FACTORY_CONFIRMATION" ? (
                            <><Clock3 className="w-3 h-3" /> Awaiting Factory</>
                          ) : (
                            "Cancelled"
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "administrators" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102B46] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#16A36A]" />
              All Platform Accounts ({users.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users
                  .filter((u) => !q || `${u.fullName} ${u.email} ${u.role} ${u.companyName}`.toLowerCase().includes(q))
                  .map((user) => (
                    <tr key={user.email || user.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-semibold text-[#102B46]">{user.fullName}</td>
                      <td className="px-5 py-3.5 text-slate-600">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[11px] text-[#102B46]">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{user.companyName || "—"}</td>
                      <td className="px-5 py-3.5 text-emerald-700 font-semibold">{user.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "notifications" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-[#102B46]">
              Platform Alerts ({notifications.length})
            </h2>
            {notifications.some((n) => n.unread) && (
              <button
                onClick={() => markAllNotificationsRead(notifications.map((n) => n.id))}
                className="text-xs font-semibold text-[#16A36A] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.href}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`block py-3 px-2 rounded-lg hover:bg-slate-50 ${notif.unread ? "bg-emerald-50/30" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs text-[#102B46]">{notif.title}</strong>
                    <span className="text-[11px] text-slate-400">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{notif.description}</p>
                </Link>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No platform alerts available.</p>
            )}
          </div>
        </div>
      )}

      {section === "analytics" && <AnalyticsCharts />}

      {(section === "audit-logs" ||
        section === "disputes" ||
        section === "reviews" ||
        section === "ai-monitoring") && <RecentActivity />}

      {section === "settings" && <AdminSettingsPage />}
    </div>
  );
}
