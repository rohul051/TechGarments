import type { AccountRecord } from "./auth";
import { loadSavedWorkspaceTheme } from "./buyerSettings";
import type {
  AdminPlatformSettings,
  AdminProfileDetails,
  AdminRole,
  User,
} from "@/types/user";

export const ADMIN_PLATFORM_SETTINGS_KEY = "techgarments_admin_platform_settings";
export const ADMIN_SETTINGS_EVENT = "garmentconnect:admin-settings-updated";
export const ADMIN_SETTINGS_CHANNEL = "garmentconnect-admin-settings";

export const ADMIN_ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "VERIFICATION_ADMIN", label: "Verification Admin" },
  { value: "OPERATIONS_ADMIN", label: "Operations Admin" },
  { value: "FINANCE_ADMIN", label: "Finance Admin" },
  { value: "SUPPORT_ADMIN", label: "Support Admin" },
];

export const DEFAULT_ADMIN_PLATFORM_SETTINGS: AdminPlatformSettings = {
  commissionRate: 5,
  autoVerifyCompleteFactories: false,
  defaultCurrency: "USD",
  maintenanceBanner: "",
};

export function formatAdminRoleLabel(role?: AdminRole): string {
  const found = ADMIN_ROLE_OPTIONS.find((item) => item.value === role);
  return found ? found.label : "Super Admin";
}

export function loadAdminPlatformSettings(): AdminPlatformSettings {
  if (typeof window === "undefined") return { ...DEFAULT_ADMIN_PLATFORM_SETTINGS };
  try {
    const raw = localStorage.getItem(ADMIN_PLATFORM_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_ADMIN_PLATFORM_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AdminPlatformSettings>;
    const rawCommission = Number(parsed.commissionRate);
    const commissionRate =
      Number.isFinite(rawCommission) && rawCommission >= 0 && rawCommission <= 35
        ? Math.round(rawCommission * 10) / 10
        : DEFAULT_ADMIN_PLATFORM_SETTINGS.commissionRate;
    const defaultCurrency =
      parsed.defaultCurrency === "EUR" || parsed.defaultCurrency === "GBP"
        ? parsed.defaultCurrency
        : "USD";

    return {
      commissionRate,
      autoVerifyCompleteFactories: Boolean(parsed.autoVerifyCompleteFactories),
      defaultCurrency,
      maintenanceBanner:
        typeof parsed.maintenanceBanner === "string" ? parsed.maintenanceBanner : "",
      ...(typeof parsed.updatedAt === "string" ? { updatedAt: parsed.updatedAt } : {}),
    };
  } catch {
    return { ...DEFAULT_ADMIN_PLATFORM_SETTINGS };
  }
}

export function saveAdminPlatformSettings(
  next: AdminPlatformSettings,
): AdminPlatformSettings {
  const sanitized: AdminPlatformSettings = {
    commissionRate:
      Number.isFinite(next.commissionRate) && next.commissionRate >= 0 && next.commissionRate <= 35
        ? Math.round(next.commissionRate * 10) / 10
        : DEFAULT_ADMIN_PLATFORM_SETTINGS.commissionRate,
    autoVerifyCompleteFactories: Boolean(next.autoVerifyCompleteFactories),
    defaultCurrency:
      next.defaultCurrency === "EUR" || next.defaultCurrency === "GBP"
        ? next.defaultCurrency
        : "USD",
    maintenanceBanner: next.maintenanceBanner.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ADMIN_PLATFORM_SETTINGS_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore local storage write failures
    }
    window.dispatchEvent(new Event(ADMIN_SETTINGS_EVENT));
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(ADMIN_SETTINGS_CHANNEL);
      channel.postMessage("updated");
      channel.close();
    }
  }

  return sanitized;
}

export function buildAdminProfile(
  currentUser: User | null,
  account?: AccountRecord,
): AdminProfileDetails {
  const email = (currentUser?.email || account?.email || "admin@techgarments.com")
    .trim()
    .toLowerCase();

  return {
    fullName: currentUser?.fullName || account?.fullName || "Super Administrator",
    email,
    phone: account?.phone || "",
    department: account?.companyName || "TechGarments Executive",
    website: account?.website || "",
    adminRole: currentUser?.adminRole || account?.adminRole || "SUPER_ADMIN",
    photoURL: currentUser?.photoURL || account?.photoURL || "",
    theme: currentUser?.theme || account?.theme || loadSavedWorkspaceTheme("admin", email),
  };
}
