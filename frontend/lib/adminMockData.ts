import type {
  KPIStat,
  MonthlyChartData,
  StatusDistributionData,
  GrowthDataPoint,
  RecentActivityItem,
  QuickActionItem,
  AdminNotification,
} from '@/types/admin.types';

/**
 * High-Level Platform KPIs (Section 5.1)
 * Clearly represents realistic mock platform baseline data for development
 */
export const adminKPIData: KPIStat[] = [
  {
    id: 'total-users',
    title: 'Total Users',
    value: '1,482',
    numericValue: 1482,
    comparisonText: 'vs last month',
    trend: 'up',
    trendPercent: '+14.2%',
    iconName: 'Users',
    href: '/admin/administrators',
    accentColor: 'blue',
  },
  {
    id: 'total-factories',
    title: 'Total Factories',
    value: '348',
    numericValue: 348,
    comparisonText: 'vs last month',
    trend: 'up',
    trendPercent: '+8.5%',
    iconName: 'Factory',
    href: '/admin/factories',
    accentColor: 'navy',
  },
  {
    id: 'total-buyers',
    title: 'Total Buyers',
    value: '1,134',
    numericValue: 1134,
    comparisonText: 'vs last month',
    trend: 'up',
    trendPercent: '+16.0%',
    iconName: 'ShoppingBag',
    href: '/admin/buyers',
    accentColor: 'purple',
  },
  {
    id: 'pending-verifications',
    title: 'Pending Verifications',
    value: '23',
    numericValue: 23,
    comparisonText: '7 require priority review',
    trend: 'neutral',
    trendPercent: 'Action Req.',
    iconName: 'FileCheck2',
    href: '/admin/verifications',
    accentColor: 'amber',
  },
  {
    id: 'total-rfqs',
    title: 'Total RFQs',
    value: '892',
    numericValue: 892,
    comparisonText: 'vs last month',
    trend: 'up',
    trendPercent: '+21.4%',
    iconName: 'FileText',
    href: '/admin/rfqs',
    accentColor: 'blue',
  },
  {
    id: 'active-orders',
    title: 'Active Orders',
    value: '147',
    numericValue: 147,
    comparisonText: 'Across 42 production lines',
    trend: 'up',
    trendPercent: '+9.1%',
    iconName: 'Clock3',
    href: '/admin/orders',
    accentColor: 'amber',
  },
  {
    id: 'completed-orders',
    title: 'Completed Orders',
    value: '628',
    numericValue: 628,
    comparisonText: '98.4% on-time delivery rate',
    trend: 'up',
    trendPercent: '+12.7%',
    iconName: 'CheckCircle2',
    href: '/admin/orders',
    accentColor: 'green',
  },
  {
    id: 'platform-gmt',
    title: 'Platform Transaction Value',
    value: '$14.28M',
    numericValue: 14280000,
    comparisonText: 'vs previous quarter ($12.02M)',
    trend: 'up',
    trendPercent: '+18.7%',
    iconName: 'DollarSign',
    href: '/admin/payments',
    accentColor: 'green',
  },
];

/**
 * 12-Month Financial & Transaction Volume Trend
 */
export const transactionVolumeTrend: MonthlyChartData[] = [
  { month: 'Jan', volume: 680, revenue: 34, ordersCount: 38 },
  { month: 'Feb', volume: 740, revenue: 37, ordersCount: 42 },
  { month: 'Mar', volume: 920, revenue: 46, ordersCount: 51 },
  { month: 'Apr', volume: 850, revenue: 42, ordersCount: 48 },
  { month: 'May', volume: 1120, revenue: 56, ordersCount: 64 },
  { month: 'Jun', volume: 1240, revenue: 62, ordersCount: 70 },
  { month: 'Jul', volume: 1180, revenue: 59, ordersCount: 66 },
  { month: 'Aug', volume: 1350, revenue: 67, ordersCount: 76 },
  { month: 'Sep', volume: 1490, revenue: 74, ordersCount: 84 },
  { month: 'Oct', volume: 1620, revenue: 81, ordersCount: 92 },
  { month: 'Nov', volume: 1780, revenue: 89, ordersCount: 98 },
  { month: 'Dec', volume: 1910, revenue: 95, ordersCount: 104 },
];

/**
 * Order Status Breakdown
 */
export const orderStatusDistribution: StatusDistributionData[] = [
  { status: 'In Production', count: 72, color: '#16A36A', percentage: 42 },
  { status: 'Quality Inspection', count: 34, color: '#3B82F6', percentage: 20 },
  { status: 'Confirmed / Sourcing', count: 28, color: '#F59E0B', percentage: 16 },
  { status: 'Ready to Ship', count: 19, color: '#8B5CF6', percentage: 11 },
  { status: 'In Transit / Shipped', count: 18, color: '#102B46', percentage: 11 },
];

/**
 * Factory Verification Distribution
 */
export const factoryVerificationStats: StatusDistributionData[] = [
  { status: 'Verified & Audited', count: 268, color: '#16A36A', percentage: 77 },
  { status: 'Pending Review', count: 23, color: '#F59E0B', percentage: 7 },
  { status: 'Under Inspection', count: 32, color: '#3B82F6', percentage: 9 },
  { status: 'Needs Information', count: 16, color: '#EC4899', percentage: 5 },
  { status: 'Rejected / Suspended', count: 9, color: '#EF4444', percentage: 2 },
];

/**
 * 6-Month Onboarding Growth Curves
 */
export const platformGrowthTrend: GrowthDataPoint[] = [
  { month: 'Jun', factories: 210, buyers: 640, totalUsers: 850 },
  { month: 'Jul', factories: 235, buyers: 720, totalUsers: 955 },
  { month: 'Aug', factories: 268, buyers: 810, totalUsers: 1078 },
  { month: 'Sep', factories: 295, buyers: 915, totalUsers: 1210 },
  { month: 'Oct', factories: 322, buyers: 1020, totalUsers: 1342 },
  { month: 'Nov', factories: 348, buyers: 1134, totalUsers: 1482 },
];

/**
 * Recent Activity Feed (Section 5.3)
 */
export const recentPlatformActivity: RecentActivityItem[] = [
  {
    id: 'act-1',
    category: 'verification',
    title: 'Audit submitted by Apex Apparels Ltd.',
    subtitle: 'Uploaded ISO 9001 and WRAP certification for review in Dhaka Zone',
    timestamp: '2026-11-22T21:40:00Z',
    relativeTime: '18 minutes ago',
    status: 'Pending Review',
    statusTone: 'warning',
    actionLabel: 'Verify Factory',
    actionHref: '/admin/verifications',
    avatarText: 'AA',
  },
  {
    id: 'act-2',
    category: 'rfq',
    title: 'New High-Volume RFQ: 50,000 Pcs Organic Cotton Hoodie',
    subtitle: 'Submitted by Nordic Wardrobe Co. (Oslo, Norway) - Target: $8.40/pc',
    timestamp: '2026-11-22T20:15:00Z',
    relativeTime: '1 hour ago',
    status: 'Open for Bids',
    statusTone: 'info',
    actionLabel: 'View RFQ',
    actionHref: '/admin/rfqs',
    avatarText: 'NW',
  },
  {
    id: 'act-3',
    category: 'order',
    title: 'Order Milestone: Cutting Completed for PO #TG-8842',
    subtitle: 'Horizon Denim Mills completed 20,000 units for Urban Stitchers',
    timestamp: '2026-11-22T19:00:00Z',
    relativeTime: '2 hours ago',
    status: 'In Production',
    statusTone: 'success',
    actionLabel: 'Track PO',
    actionHref: '/admin/production',
    avatarText: 'HD',
  },
  {
    id: 'act-4',
    category: 'buyer',
    title: 'New Enterprise Buyer Registered: Pacific Coast Retailers',
    subtitle: 'United States · Annual Sourcing Volume > $5M · Verified EIN',
    timestamp: '2026-11-22T17:30:00Z',
    relativeTime: '4 hours ago',
    status: 'Active',
    statusTone: 'success',
    actionLabel: 'Buyer Profile',
    actionHref: '/admin/buyers',
    avatarText: 'PC',
  },
  {
    id: 'act-5',
    category: 'complaint',
    title: 'Delivery Delay Alert on Contract #CT-1092',
    subtitle: 'Buyer requested administrative mediation regarding 4-day shipment timeline',
    timestamp: '2026-11-22T15:20:00Z',
    relativeTime: '6 hours ago',
    status: 'Dispute Open',
    statusTone: 'danger',
    actionLabel: 'Review Dispute',
    actionHref: '/admin/disputes',
    avatarText: 'DP',
  },
  {
    id: 'act-6',
    category: 'quotation',
    title: 'Competitive Quote Accepted ($142,500 total value)',
    subtitle: 'Samira Rahman (Rahman Apparel Mills) awarded PO for 30,000 polo shirts',
    timestamp: '2026-11-22T13:10:00Z',
    relativeTime: '8 hours ago',
    status: 'Contract Created',
    statusTone: 'success',
    actionLabel: 'View Contract',
    actionHref: '/admin/contracts',
    avatarText: 'RM',
  },
];

/**
 * Quick Action Shortcuts (Section 5.4)
 */
export const adminQuickActions: QuickActionItem[] = [
  {
    id: 'qa-review-factories',
    title: 'Review Factory Applications',
    description: '23 manufacturing partners waiting for compliance verification.',
    badge: '23 Pending',
    iconName: 'BadgeCheck',
    href: '/admin/verifications',
    priority: 'high',
  },
  {
    id: 'qa-manage-users',
    title: 'Manage Users & Access',
    description: 'Inspect buyer accounts, factory members, and role-based permissions.',
    iconName: 'ShieldCheck',
    href: '/admin/administrators',
  },
  {
    id: 'qa-reported-content',
    title: 'Review Reported Content',
    description: 'Inspect 3 flagged listings or inappropriate review feedback.',
    badge: '3 Flagged',
    iconName: 'AlertTriangle',
    href: '/admin/reviews',
  },
  {
    id: 'qa-disputes',
    title: 'View Pending Disputes',
    description: 'Active commercial mediation cases between buyers and suppliers.',
    badge: '2 Open',
    iconName: 'Scale',
    href: '/admin/disputes',
    priority: 'high',
  },
  {
    id: 'qa-reports',
    title: 'Generate Platform Reports',
    description: 'Export quarterly marketplace transactions, compliance audits, and CSVs.',
    iconName: 'FileSpreadsheet',
    href: '/admin/analytics',
  },
];

/**
 * Real-time Admin Notifications
 */
export const initialAdminNotifications: AdminNotification[] = [
  {
    id: 'notif-1',
    title: 'Priority Factory Application',
    description: 'Apex Textiles Ltd. submitted factory audit report in Dhaka.',
    type: 'verification',
    unread: true,
    time: '18m ago',
    href: '/admin/verifications',
  },
  {
    id: 'notif-2',
    title: 'Dispute Mediation Requested',
    description: 'Nordic Wardrobe Co. opened a dispute regarding PO #TG-8842.',
    type: 'dispute',
    unread: true,
    time: '2h ago',
    href: '/admin/disputes',
  },
  {
    id: 'notif-3',
    title: 'System Health Check Clean',
    description: 'Cloud Firestore and AI Matching Engine running with 99.98% uptime.',
    type: 'system',
    unread: false,
    time: '5h ago',
    href: '/admin/ai-monitoring',
  },
  {
    id: 'notif-4',
    title: 'High-Value Escrow Completed',
    description: '$84,500 milestone payment finalized for shipment delivery.',
    type: 'payment',
    unread: false,
    time: '1d ago',
    href: '/admin/payments',
  },
];
