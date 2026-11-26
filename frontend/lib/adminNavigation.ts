export interface AdminNavMeta {
  id: string;
  label: string;
  href: string;
  badge?: string | number;
  badgeTone?: "neutral" | "success" | "warning" | "danger";
  section?: "core" | "operations" | "monitoring" | "governance";
}

export const adminNavigationMeta: AdminNavMeta[] = [
  // Core Platform
  { id: "overview", label: "Overview", href: "/admin/dashboard", section: "core" },
  { id: "factories", label: "Factory Management", href: "/admin/factories", section: "core" },
  { id: "buyers", label: "Buyer Management", href: "/admin/buyers", section: "core" },
  { id: "verifications", label: "Verification Center", href: "/admin/verifications", badgeTone: "warning", section: "core" },
  { id: "resources", label: "Resource Management", href: "/admin/resources", section: "core" },

  // Commercial Operations
  { id: "rfqs", label: "RFQ Management", href: "/admin/rfqs", section: "operations" },
  { id: "quotations", label: "Quotation Management", href: "/admin/quotations", section: "operations" },
  { id: "contracts", label: "Contract Management", href: "/admin/contracts", section: "operations" },
  { id: "orders", label: "Order Management", href: "/admin/orders", section: "operations" },
  { id: "production", label: "Production Monitoring", href: "/admin/production", section: "operations" },
  { id: "quality-control", label: "Quality Control", href: "/admin/quality-control", section: "operations" },
  { id: "shipments", label: "Shipment Management", href: "/admin/shipments", section: "operations" },
  { id: "payments", label: "Payment Management", href: "/admin/payments", section: "operations" },

  // Governance & Intelligence
  { id: "disputes", label: "Disputes & Complaints", href: "/admin/disputes", badgeTone: "danger", section: "governance" },
  { id: "reviews", label: "Reviews & Ratings", href: "/admin/reviews", section: "governance" },
  { id: "ai-monitoring", label: "AI Monitoring", href: "/admin/ai-monitoring", badge: "Live", badgeTone: "success", section: "governance" },
  { id: "analytics", label: "Analytics & Reports", href: "/admin/analytics", section: "governance" },
  { id: "notifications", label: "Notifications", href: "/admin/notifications", badgeTone: "warning", section: "governance" },
  { id: "administrators", label: "Admin Management", href: "/admin/administrators", section: "governance" },
  { id: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs", section: "governance" },
  { id: "settings", label: "Settings", href: "/admin/settings", section: "governance" },
];
