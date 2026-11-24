import type { LucideIcon } from 'lucide-react';
import type { AdminRole } from './user';

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeTone?: 'neutral' | 'success' | 'warning' | 'danger';
  allowedRoles?: AdminRole[];
}

export interface KPIStat {
  id: string;
  title: string;
  value: string;
  numericValue: number;
  comparisonText: string;
  trend: 'up' | 'down' | 'neutral';
  trendPercent: string;
  iconName: string;
  href: string;
  accentColor: 'navy' | 'green' | 'amber' | 'blue' | 'purple';
}

export interface MonthlyChartData {
  month: string;
  volume: number; // in USD thousands
  revenue: number; // platform fee in USD thousands
  ordersCount: number;
}

export interface StatusDistributionData {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

export interface GrowthDataPoint {
  month: string;
  factories: number;
  buyers: number;
  totalUsers: number;
}

export interface RecentActivityItem {
  id: string;
  category: 'factory' | 'buyer' | 'rfq' | 'quotation' | 'order' | 'verification' | 'complaint';
  title: string;
  subtitle: string;
  timestamp: string;
  relativeTime: string;
  status: string;
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  actionLabel?: string;
  actionHref: string;
  avatarText?: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
  iconName: string;
  href: string;
  priority?: 'high' | 'normal';
}

export interface AdminNotification {
  id: string;
  title: string;
  description: string;
  type: 'verification' | 'dispute' | 'order' | 'system' | 'payment';
  unread: boolean;
  time: string;
  href: string;
}
