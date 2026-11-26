"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import {
  deleteUserAccount,
  findAccount,
  getRegisteredAccounts,
  getUser,
  saveCurrentUser,
  saveRegisteredAccount,
  updateBuyerAuthDisplayName,
} from "@/lib/auth";
import {
  ADMIN_SETTINGS_CHANNEL,
  ADMIN_SETTINGS_EVENT,
  buildAdminProfile,
  DEFAULT_ADMIN_PLATFORM_SETTINGS,
  loadAdminPlatformSettings,
  saveAdminPlatformSettings,
} from "@/lib/adminSettings";
import { loadSavedWorkspaceTheme, persistWorkspaceTheme } from "@/lib/buyerSettings";
import { auth, db } from "@/lib/firebase";
import type { AdminPlatformSettings, AdminProfileDetails, BuyerTheme } from "@/types/user";
import type {
  AdminNotification,
  KPIStat,
  MonthlyChartData,
  QuickActionItem,
  RecentActivityItem,
  StatusDistributionData,
} from "@/types/admin.types";

export interface AdminFactoryRecord {
  id: string;
  email: string;
  companyName: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  website: string;
  monthlyCapacity: number;
  moq: number;
  processes: string[];
  products: string[];
  coverPhotoURL: string;
  verified: boolean;
  updatedAt: string;
}

export interface AdminBuyerRecord {
  id: string;
  email: string;
  companyName: string;
  fullName: string;
  buyerType: string;
  phone: string;
  country: string;
  website: string;
  photoURL: string;
  updatedAt: string;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: "BUYER" | "FACTORY" | "ADMIN";
  companyName: string;
  country: string;
  status: string;
}

export interface AdminRfqRecord {
  id: string;
  title: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  category: string;
  quantityText: string;
  quantityNum: number;
  deadline: string;
  location: string;
  budget: string;
  status: string;
  createdAt: string;
  isOnline: boolean;
}

export interface AdminQuoteRecord {
  id: string;
  requestId: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  factoryId: string;
  factoryEmail: string;
  factoryName: string;
  product: string;
  quantityText: string;
  quantityNum: number;
  pricePerUnit: number;
  currency: string;
  leadTime: string;
  terms: string;
  status: string;
  createdAt: string;
  isOnline: boolean;
}

export interface AdminOrderRecord {
  id: string;
  quoteId: string;
  requestId: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  factoryId: string;
  factoryEmail: string;
  factoryName: string;
  product: string;
  productType: string;
  quantityText: string;
  quantityNum: number;
  targetDeliveryDate: string;
  pricePerUnit: number;
  currency: string;
  totalValue: number;
  status: "PENDING_FACTORY_CONFIRMATION" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  isOnline: boolean;
}

interface AdminDataContextValue {
  factories: AdminFactoryRecord[];
  buyers: AdminBuyerRecord[];
  users: AdminUserRecord[];
  rfqs: AdminRfqRecord[];
  quotes: AdminQuoteRecord[];
  orders: AdminOrderRecord[];
  kpis: KPIStat[];
  quickActions: QuickActionItem[];
  transactionTrend: MonthlyChartData[];
  orderStatusBreakdown: StatusDistributionData[];
  verificationBreakdown: StatusDistributionData[];
  activities: RecentActivityItem[];
  notifications: AdminNotification[];
  sidebarBadges: Record<string, string | number | undefined>;
  totalOrderValue: number;
  hasMounted: boolean;
  adminProfile: AdminProfileDetails;
  adminTheme: BuyerTheme;
  platformSettings: AdminPlatformSettings;
  isRefreshing: boolean;
  lastRefreshed: string;
  toggleFactoryVerification: (factoryKey: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (ids: string[]) => void;
  saveAdminProfile: (nextProfile: AdminProfileDetails) => Promise<string>;
  changeAdminTheme: (nextTheme: BuyerTheme) => Promise<void>;
  updatePlatformSettings: (nextSettings: AdminPlatformSettings) => AdminPlatformSettings;
  clearVerificationOverrides: () => void;
  clearReadNotifications: () => void;
  resetAdminAccount: () => Promise<string>;
  deleteAdminAccount: (password: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const ADMIN_VERIFICATIONS_KEY = "techgarments_admin_factory_verifications";
const ADMIN_READ_NOTIFS_KEY = "techgarments_admin_read_notifications";

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function parseUnits(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const digits = Number(value.replace(/[^\d]/g, ""));
    return Number.isFinite(digits) && digits > 0 ? digits : 0;
  }
  return 0;
}

function loadVerificationOverrides(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ADMIN_VERIFICATIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function loadReadNotificationIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_READ_NOTIFS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function readIndexedDbStore(
  dbName: string,
  storeName: string,
): Promise<Record<string, unknown>[]> {
  if (typeof indexedDB === "undefined") return Promise.resolve([]);
  return new Promise((resolve) => {
    try {
      const openReq = indexedDB.open(dbName, 1);
      openReq.onupgradeneeded = () => {
        if (!openReq.result.objectStoreNames.contains(storeName)) {
          openReq.result.createObjectStore(storeName, { keyPath: "id" });
        }
      };
      openReq.onsuccess = () => {
        const database = openReq.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.close();
          resolve([]);
          return;
        }
        try {
          const tx = database.transaction(storeName, "readonly");
          const getAll = tx.objectStore(storeName).getAll();
          getAll.onsuccess = () => {
            database.close();
            resolve(
              Array.isArray(getAll.result)
                ? getAll.result.filter(
                  (row): row is Record<string, unknown> =>
                    Boolean(row) && typeof row === "object",
                )
                : [],
            );
          };
          getAll.onerror = () => {
            database.close();
            resolve([]);
          };
        } catch {
          database.close();
          resolve([]);
        }
      };
      openReq.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

function formatRelativeTime(isoOrDate: string): string {
  if (!isoOrDate) return "Recently";
  const time = new Date(isoOrDate).getTime();
  if (!Number.isFinite(time)) return "Recently";
  const diffMinutes = Math.max(0, Math.round((Date.now() - time) / 60_000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [localAccountsVersion, setLocalAccountsVersion] = useState(0);
  const [verificationOverrides, setVerificationOverrides] = useState<Record<string, boolean>>({});
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [platformSettings, setPlatformSettings] = useState<AdminPlatformSettings>(() => ({
    ...DEFAULT_ADMIN_PLATFORM_SETTINGS,
  }));
  const [adminTheme, setAdminTheme] = useState<BuyerTheme>("default");

  const [localRfqs, setLocalRfqs] = useState<Record<string, unknown>[]>([]);
  const [localQuotes, setLocalQuotes] = useState<Record<string, unknown>[]>([]);
  const [localOrders, setLocalOrders] = useState<Record<string, unknown>[]>([]);

  const [remoteFactories, setRemoteFactories] = useState<Record<string, unknown>[]>([]);
  const [remoteBuyers, setRemoteBuyers] = useState<Record<string, unknown>[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<Record<string, unknown>[]>([]);
  const [remotePublicRfqs, setRemotePublicRfqs] = useState<Record<string, unknown>[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("Just now");

  const reloadLocalStores = useCallback(async () => {
    const [reqs, quotesRows, orderRows] = await Promise.all([
      readIndexedDbStore("garmentconnect-production-requests", "requests"),
      readIndexedDbStore("garmentconnect-production-quotes", "quotes"),
      readIndexedDbStore("garmentconnect-orders", "orders"),
    ]);
    const currentUser = getUser();
    const activeEmail = currentUser?.email?.trim().toLowerCase() || "admin@techgarments.com";
    const matchingAccount = findAccount(activeEmail);
    setHasMounted(true);
    setVerificationOverrides(loadVerificationOverrides());
    setReadNotifIds(loadReadNotificationIds());
    setPlatformSettings(loadAdminPlatformSettings());
    setAdminTheme(currentUser?.theme || matchingAccount?.theme || loadSavedWorkspaceTheme("admin", activeEmail));
    setLocalRfqs(reqs);
    setLocalQuotes(quotesRows);
    setLocalOrders(orderRows);
    setLocalAccountsVersion((v) => v + 1);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await reloadLocalStores();
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } finally {
      window.setTimeout(() => setIsRefreshing(false), 250);
    }
  }, [reloadLocalStores]);

  useEffect(() => {
    let active = true;

    const loadOnMount = async () => {
      await reloadLocalStores();
      if (active) {
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    };
    void loadOnMount();

    const handleAccountsChange = () => {
      if (!active) return;
      const currentUser = getUser();
      const activeEmail = currentUser?.email?.trim().toLowerCase() || "admin@techgarments.com";
      const matchingAccount = findAccount(activeEmail);
      setAdminTheme(currentUser?.theme || matchingAccount?.theme || loadSavedWorkspaceTheme("admin", activeEmail));
      setLocalAccountsVersion((v) => v + 1);
    };
    const handleIndexedDbChange = () => {
      if (active) void reloadLocalStores();
    };
    const handlePlatformSettingsChange = () => {
      if (active) setPlatformSettings(loadAdminPlatformSettings());
    };

    window.addEventListener("storage", handleAccountsChange);
    window.addEventListener("garmentconnect:accounts-updated", handleAccountsChange);
    window.addEventListener("garmentconnect:production-requests-updated", handleIndexedDbChange);
    window.addEventListener("garmentconnect:quotes-updated", handleIndexedDbChange);
    window.addEventListener("garmentconnect:orders-updated", handleIndexedDbChange);
    window.addEventListener(ADMIN_SETTINGS_EVENT, handlePlatformSettingsChange);

    const requestChannel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("garmentconnect-production-requests")
      : null;
    const quoteChannel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("garmentconnect-production-quotes")
      : null;
    const orderChannel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("garmentconnect-orders")
      : null;
    const usersChannel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("garmentconnect-registered-users")
      : null;
    const adminSettingsChannel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(ADMIN_SETTINGS_CHANNEL)
      : null;

    if (requestChannel) requestChannel.onmessage = handleIndexedDbChange;
    if (quoteChannel) quoteChannel.onmessage = handleIndexedDbChange;
    if (orderChannel) orderChannel.onmessage = handleIndexedDbChange;
    if (usersChannel) usersChannel.onmessage = handleAccountsChange;
    if (adminSettingsChannel) adminSettingsChannel.onmessage = handlePlatformSettingsChange;

    // Public factories directory (always readable under firestore.rules)
    const stopFactories = onSnapshot(
      collection(db, "factories"),
      (snapshot) => {
        if (!active) return;
        setRemoteFactories(
          snapshot.docs.map((d) => ({ ...d.data(), id: d.id })),
        );
      },
      () => { },
    );

    let stopBuyers = () => { };
    let stopUsers = () => { };
    let stopPublicRfqs = () => { };

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      stopBuyers();
      stopUsers();
      stopPublicRfqs();
      stopBuyers = () => { };
      stopUsers = () => { };
      stopPublicRfqs = () => { };

      if (!active || !firebaseUser) return;

      stopBuyers = onSnapshot(
        collection(db, "buyers"),
        (snapshot) => {
          if (!active) return;
          setRemoteBuyers(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        },
        () => { },
      );

      stopUsers = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          if (!active) return;
          setRemoteUsers(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        },
        () => { },
      );

      stopPublicRfqs = onSnapshot(
        query(collection(db, "orders"), where("factoryId", "==", null)),
        (snapshot) => {
          if (!active) return;
          setRemotePublicRfqs(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        },
        () => { },
      );
    });

    return () => {
      active = false;
      window.removeEventListener("storage", handleAccountsChange);
      window.removeEventListener("garmentconnect:accounts-updated", handleAccountsChange);
      window.removeEventListener("garmentconnect:production-requests-updated", handleIndexedDbChange);
      window.removeEventListener("garmentconnect:quotes-updated", handleIndexedDbChange);
      window.removeEventListener("garmentconnect:orders-updated", handleIndexedDbChange);
      window.removeEventListener(ADMIN_SETTINGS_EVENT, handlePlatformSettingsChange);
      requestChannel?.close();
      quoteChannel?.close();
      orderChannel?.close();
      usersChannel?.close();
      adminSettingsChannel?.close();
      stopFactories();
      stopBuyers();
      stopUsers();
      stopPublicRfqs();
      unsubscribeAuth();
    };
  }, [reloadLocalStores]);

  const toggleFactoryVerification = useCallback((factoryKey: string) => {
    setVerificationOverrides((prev) => {
      const next = { ...prev, [factoryKey]: !(prev[factoryKey] ?? false) };
      try {
        localStorage.setItem(ADMIN_VERIFICATIONS_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setReadNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(ADMIN_READ_NOTIFS_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback((ids: string[]) => {
    setReadNotifIds((prev) => {
      const allIds = new Set([...prev, ...ids]);
      const next = [...allIds];
      try {
        localStorage.setItem(ADMIN_READ_NOTIFS_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const clearVerificationOverrides = useCallback(() => {
    setVerificationOverrides({});
    try {
      localStorage.removeItem(ADMIN_VERIFICATIONS_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const clearReadNotifications = useCallback(() => {
    setReadNotifIds([]);
    try {
      localStorage.removeItem(ADMIN_READ_NOTIFS_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const saveAdminProfile = useCallback(async (nextProfile: AdminProfileDetails): Promise<string> => {
    const cleanEmail = nextProfile.email.trim().toLowerCase() || "admin@techgarments.com";
    const existingAccount = findAccount(cleanEmail);
    const currentUser = getUser();
    const resolvedId =
      currentUser?.id ||
      existingAccount?.id ||
      (cleanEmail === "admin@techgarments.com" ? "admin-master-001" : `local:${cleanEmail}`);

    saveRegisteredAccount({
      ...(existingAccount || { password: "adminpassword123" }),
      id: resolvedId,
      email: cleanEmail,
      password: existingAccount?.password || "adminpassword123",
      fullName: nextProfile.fullName,
      role: "ADMIN",
      adminRole: nextProfile.adminRole,
      phone: nextProfile.phone,
      companyName: nextProfile.department,
      website: nextProfile.website,
      photoURL: nextProfile.photoURL ?? "",
      theme: nextProfile.theme ?? existingAccount?.theme ?? adminTheme,
    });

    saveCurrentUser({
      id: resolvedId,
      email: cleanEmail,
      fullName: nextProfile.fullName,
      role: "ADMIN",
      adminRole: nextProfile.adminRole,
      ...(nextProfile.photoURL ? { photoURL: nextProfile.photoURL } : {}),
      theme: nextProfile.theme ?? adminTheme,
    });

    if (auth.currentUser && auth.currentUser.email?.toLowerCase() === cleanEmail) {
      await updateBuyerAuthDisplayName(nextProfile.fullName);
      try {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            fullName: nextProfile.fullName,
            phoneNumber: nextProfile.phone,
            photoURL: nextProfile.photoURL || "",
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch (err) {
        console.warn("[Admin Profile] Could not sync admin profile to Firestore:", err);
      }
    }

    setLocalAccountsVersion((v) => v + 1);
    return "Admin profile settings saved and synced across the portal.";
  }, [adminTheme]);

  const changeAdminTheme = useCallback(async (nextTheme: BuyerTheme): Promise<void> => {
    const currentUser = getUser();
    const cleanEmail = currentUser?.email?.trim().toLowerCase() || "admin@techgarments.com";
    const existingAccount = findAccount(cleanEmail);

    persistWorkspaceTheme("admin", nextTheme, cleanEmail);
    setAdminTheme(nextTheme);

    if (existingAccount) {
      saveRegisteredAccount({
        ...existingAccount,
        theme: nextTheme,
      });
    }
    if (currentUser) {
      saveCurrentUser({
        ...currentUser,
        theme: nextTheme,
      });
    }
    setLocalAccountsVersion((v) => v + 1);
  }, []);

  const updatePlatformSettings = useCallback(
    (nextSettings: AdminPlatformSettings): AdminPlatformSettings => {
      const saved = saveAdminPlatformSettings(nextSettings);
      setPlatformSettings(saved);
      return saved;
    },
    [],
  );

  const resetAdminAccount = useCallback(async (): Promise<string> => {
    const currentUser = getUser();
    const cleanEmail = currentUser?.email?.trim().toLowerCase() || "admin@techgarments.com";
    const existingAccount = findAccount(cleanEmail);
    const defaultName =
      cleanEmail === "admin@techgarments.com" ? "Super Administrator" : cleanEmail.split("@")[0];
    const resolvedId =
      currentUser?.id ||
      existingAccount?.id ||
      (cleanEmail === "admin@techgarments.com" ? "admin-master-001" : `local:${cleanEmail}`);

    persistWorkspaceTheme("admin", "default", cleanEmail);
    setAdminTheme("default");

    const resetSettings = saveAdminPlatformSettings(DEFAULT_ADMIN_PLATFORM_SETTINGS);
    setPlatformSettings(resetSettings);

    clearVerificationOverrides();
    clearReadNotifications();

    saveRegisteredAccount({
      ...(existingAccount || { password: "adminpassword123" }),
      id: resolvedId,
      email: cleanEmail,
      password: existingAccount?.password || "adminpassword123",
      fullName: defaultName,
      role: "ADMIN",
      adminRole: "SUPER_ADMIN",
      phone: "",
      companyName: "TechGarments Executive",
      website: "",
      photoURL: "",
      theme: "default",
    });

    saveCurrentUser({
      id: resolvedId,
      email: cleanEmail,
      fullName: defaultName,
      role: "ADMIN",
      adminRole: "SUPER_ADMIN",
      theme: "default",
    });

    if (auth.currentUser && auth.currentUser.email?.toLowerCase() === cleanEmail) {
      await updateBuyerAuthDisplayName(defaultName);
      try {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            fullName: defaultName,
            phoneNumber: "",
            photoURL: "",
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch (err) {
        console.warn("[Admin Reset] Could not reset Firestore user fields:", err);
      }
    }

    setLocalAccountsVersion((v) => v + 1);
    return "Admin profile, theme colour, and platform preferences restored to defaults.";
  }, [clearReadNotifications, clearVerificationOverrides]);

  const deleteAdminAccount = useCallback(async (password: string): Promise<void> => {
    const currentUser = getUser();
    const cleanEmail = currentUser?.email?.trim().toLowerCase() || "admin@techgarments.com";
    await deleteUserAccount(cleanEmail, password);
  }, []);

  const computed = useMemo(() => {
    const localAccounts =
      hasMounted && localAccountsVersion >= 0 ? Object.values(getRegisteredAccounts()) : [];
    const activeUser = hasMounted ? getUser() : null;
    const activeAdminEmail = (activeUser?.email || "admin@techgarments.com").trim().toLowerCase();
    const activeAdminAccount = hasMounted
      ? localAccounts.find((acc) => acc.email.trim().toLowerCase() === activeAdminEmail)
      : undefined;
    const adminProfile = buildAdminProfile(activeUser, activeAdminAccount);

    // 1. Merge Factories (Remote + Local)
    const factoryMap = new Map<string, AdminFactoryRecord>();
    for (const remote of remoteFactories) {
      const email = getText(remote.email).toLowerCase();
      const id = getText(remote.id);
      const key = email || id;
      if (!key) continue;
      const companyName = getText(remote.companyName) || getText(remote.fullName) || "Factory Partner";
      const country = getText(remote.country) || "Not specified";
      const monthlyCapacity = Number(remote.monthlyCapacity) || 0;
      const products = getStringArray(remote.products);
      const isCompleteProfile = Boolean(
        companyName && country !== "Not specified" && monthlyCapacity > 0 && products.length > 0,
      );
      factoryMap.set(key, {
        id: id || key,
        email,
        companyName,
        fullName: getText(remote.fullName) || "Representative",
        phone: getText(remote.phone),
        country,
        city: getText(remote.city),
        website: getText(remote.website),
        monthlyCapacity,
        moq: Number(remote.moq) || 0,
        processes: getStringArray(remote.processes),
        products,
        coverPhotoURL: getText(remote.coverPhotoURL),
        verified:
          verificationOverrides[key] ??
          (remote.verified === true ||
            (platformSettings.autoVerifyCompleteFactories && isCompleteProfile)),
        updatedAt: getText(remote.updatedAt),
      });
    }
    for (const acc of localAccounts) {
      if (acc.role !== "FACTORY") continue;
      const email = acc.email.trim().toLowerCase();
      const key = email || acc.id || "";
      if (!key) continue;
      const existing = factoryMap.get(key);
      const companyName = acc.companyName || existing?.companyName || acc.fullName || "Factory Partner";
      const country = acc.country || existing?.country || "Not specified";
      const monthlyCapacity = acc.monthlyCapacity ?? existing?.monthlyCapacity ?? 0;
      const products = acc.products?.length ? acc.products : existing?.products ?? [];
      const isCompleteProfile = Boolean(
        companyName && country !== "Not specified" && monthlyCapacity > 0 && products.length > 0,
      );
      factoryMap.set(key, {
        id: existing?.id || acc.id || `local:${email}`,
        email,
        companyName,
        fullName: acc.fullName || existing?.fullName || "Representative",
        phone: acc.phone || existing?.phone || "",
        country,
        city: acc.city || existing?.city || "",
        website: acc.website || existing?.website || "",
        monthlyCapacity,
        moq: acc.moq ?? existing?.moq ?? 0,
        processes: acc.processes?.length ? acc.processes : existing?.processes ?? [],
        products,
        coverPhotoURL: acc.coverPhotoURL || existing?.coverPhotoURL || "",
        verified:
          verificationOverrides[key] ??
          (Boolean(existing?.verified) ||
            (platformSettings.autoVerifyCompleteFactories && isCompleteProfile)),
        updatedAt: existing?.updatedAt || "",
      });
    }
    const factories = [...factoryMap.values()];

    // 2. Merge Buyers (Remote + Local)
    const buyerMap = new Map<string, AdminBuyerRecord>();
    for (const remote of remoteBuyers) {
      const email = getText(remote.email).toLowerCase();
      const id = getText(remote.id);
      const key = email || id;
      if (!key) continue;
      buyerMap.set(key, {
        id: id || key,
        email,
        companyName: getText(remote.companyName) || getText(remote.fullName) || "Brand Buyer",
        fullName: getText(remote.fullName) || "Buyer Account",
        buyerType: getText(remote.buyerType) || "Clothing Brand",
        phone: getText(remote.phone),
        country: getText(remote.country) || "Not specified",
        website: getText(remote.website),
        photoURL: getText(remote.photoURL),
        updatedAt: getText(remote.updatedAt),
      });
    }
    for (const acc of localAccounts) {
      if (acc.role !== "BUYER") continue;
      const email = acc.email.trim().toLowerCase();
      const key = email || acc.id || "";
      if (!key) continue;
      const existing = buyerMap.get(key);
      buyerMap.set(key, {
        id: existing?.id || acc.id || `local:${email}`,
        email,
        companyName: acc.companyName || existing?.companyName || acc.fullName || "Brand Buyer",
        fullName: acc.fullName || existing?.fullName || "Buyer Account",
        buyerType: acc.buyerType || existing?.buyerType || "Clothing Brand",
        phone: acc.phone || existing?.phone || "",
        country: acc.country || existing?.country || "Not specified",
        website: acc.website || existing?.website || "",
        photoURL: acc.photoURL || existing?.photoURL || "",
        updatedAt: existing?.updatedAt || "",
      });
    }
    const buyers = [...buyerMap.values()];

    // 3. Merge All Users (Factories + Buyers + Admins + Remote users)
    const userMap = new Map<string, AdminUserRecord>();
    for (const u of remoteUsers) {
      if (u.isActive === false) continue;
      const email = getText(u.email).toLowerCase();
      const id = getText(u.id);
      const roleText = getText(u.role).toUpperCase();
      const role = roleText === "ADMIN" ? "ADMIN" : roleText === "FACTORY" ? "FACTORY" : "BUYER";
      const key = email || id;
      if (!key) continue;
      userMap.set(key, {
        id: id || key,
        email,
        fullName: getText(u.fullName) || email,
        role,
        companyName: "",
        country: "",
        status: "Active",
      });
    }
    for (const f of factories) {
      const key = f.email || f.id;
      userMap.set(key, {
        id: f.id,
        email: f.email,
        fullName: f.fullName,
        role: "FACTORY",
        companyName: f.companyName,
        country: f.country,
        status: f.verified ? "Verified" : "Pending Review",
      });
    }
    for (const b of buyers) {
      const key = b.email || b.id;
      userMap.set(key, {
        id: b.id,
        email: b.email,
        fullName: b.fullName,
        role: "BUYER",
        companyName: b.companyName,
        country: b.country,
        status: "Active",
      });
    }
    for (const acc of localAccounts) {
      if (acc.role !== "ADMIN") continue;
      const email = acc.email.trim().toLowerCase();
      userMap.set(email, {
        id: acc.id || `local:${email}`,
        email,
        fullName: acc.fullName,
        role: "ADMIN",
        companyName: acc.companyName || "TechGarments",
        country: acc.country || "Global",
        status: "Active",
      });
    }
    const users = [...userMap.values()];

    // 4. Merge RFQs (Local Requests + Firestore Public RFQs)
    const rfqMap = new Map<string, AdminRfqRecord>();
    for (const row of remotePublicRfqs) {
      const id = getText(row.requestId) || getText(row.id);
      if (!id) continue;
      const specs = row.specifications && typeof row.specifications === "object"
        ? (row.specifications as Record<string, unknown>)
        : {};
      const qtyNum = parseUnits(row.quantity);
      rfqMap.set(id, {
        id,
        title: getText(row.title) || getText(row.productType) || "Production Request",
        buyerId: getText(row.buyerId),
        buyerEmail: getText(row.buyerEmail).toLowerCase(),
        buyerName: getText(row.buyerName) || getText(row.buyerEmail) || "Garment Buyer",
        category: getText(specs.category) || getText(row.productType) || "Apparel",
        quantityText: qtyNum > 0 ? `${qtyNum.toLocaleString()} pcs` : "Not specified",
        quantityNum: qtyNum,
        deadline: getText(row.targetDeliveryDate) || getText(row.deadline) || "Not specified",
        location: getText(row.location) || "Not specified",
        budget: row.targetPricePerUnit != null ? String(row.targetPricePerUnit) : "",
        status: getText(row.status) || "PENDING_QUOTE",
        createdAt: getText(row.createdAt),
        isOnline: true,
      });
    }
    for (const row of localRfqs) {
      const id = getText(row.id);
      if (!id) continue;
      const existing = rfqMap.get(id);
      const qtyNum = parseUnits(row.quantity);
      rfqMap.set(id, {
        id,
        title: getText(row.product) || existing?.title || "Production Request",
        buyerId: getText(row.ownerId) || existing?.buyerId || "",
        buyerEmail: getText(row.ownerEmail).toLowerCase() || existing?.buyerEmail || "",
        buyerName: getText(row.buyerName) || existing?.buyerName || "Garment Buyer",
        category: getText(row.category) || existing?.category || "Apparel",
        quantityText: getText(row.quantity) || existing?.quantityText || "Not specified",
        quantityNum: qtyNum || existing?.quantityNum || 0,
        deadline: getText(row.deadline) || existing?.deadline || "Not specified",
        location: getText(row.location) || existing?.location || "Not specified",
        budget: getText(row.budget) || existing?.budget || "",
        status: getText(row.status) || existing?.status || "Matching",
        createdAt: getText(row.createdAt) || existing?.createdAt || "",
        isOnline: Boolean(row.isOnline || existing?.isOnline),
      });
    }

    // 5. Merge Quotes
    const quoteMap = new Map<string, AdminQuoteRecord>();
    for (const row of localQuotes) {
      const id = getText(row.id);
      const price = Number(row.pricePerUnit);
      if (!id || !Number.isFinite(price)) continue;
      const qtyNum = parseUnits(row.quantity);
      quoteMap.set(id, {
        id,
        requestId: getText(row.requestId),
        buyerId: getText(row.buyerId),
        buyerEmail: getText(row.buyerEmail).toLowerCase(),
        buyerName: getText(row.buyerName) || getText(row.buyerEmail) || "Buyer",
        factoryId: getText(row.factoryId),
        factoryEmail: getText(row.factoryEmail).toLowerCase(),
        factoryName: getText(row.factoryName) || "Factory",
        product: getText(row.product) || "Apparel",
        quantityText: getText(row.quantity) || `${qtyNum.toLocaleString()} pcs`,
        quantityNum: qtyNum,
        pricePerUnit: price,
        currency: getText(row.currency) || "USD",
        leadTime: getText(row.leadTime) || "Not specified",
        terms: getText(row.terms),
        status: getText(row.status) || "PENDING",
        createdAt: getText(row.createdAt),
        isOnline: Boolean(row.isOnline),
      });
    }
    const quotes = [...quoteMap.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // 6. Merge Orders
    const orderMap = new Map<string, AdminOrderRecord>();
    for (const row of localOrders) {
      const id = getText(row.id);
      const rawStatus = getText(row.status);
      if (
        !id ||
        !["PENDING_FACTORY_CONFIRMATION", "CONFIRMED", "CANCELLED"].includes(rawStatus)
      ) {
        continue;
      }
      const qtyNum = parseUnits(row.quantity);
      const price = Number(row.pricePerUnit) || 0;
      orderMap.set(id, {
        id,
        quoteId: getText(row.quoteId),
        requestId: getText(row.requestId),
        buyerId: getText(row.buyerId),
        buyerEmail: getText(row.buyerEmail).toLowerCase(),
        buyerName: getText(row.buyerName) || "Buyer",
        factoryId: getText(row.factoryId),
        factoryEmail: getText(row.factoryEmail).toLowerCase(),
        factoryName: getText(row.factoryName) || "Factory",
        product: getText(row.product) || "Apparel",
        productType: getText(row.productType) || "Apparel",
        quantityText: getText(row.quantity) || `${qtyNum.toLocaleString()} pcs`,
        quantityNum: qtyNum,
        targetDeliveryDate: getText(row.targetDeliveryDate) || "Not specified",
        pricePerUnit: price,
        currency: getText(row.currency) || "USD",
        totalValue: qtyNum * price,
        status: rawStatus as AdminOrderRecord["status"],
        createdAt: getText(row.createdAt),
        updatedAt: getText(row.updatedAt) || getText(row.createdAt),
        isOnline: Boolean(row.isOnline),
      });
    }
    const orders = [...orderMap.values()].sort((a, b) =>
      (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
    );

    // Enrich RFQ statuses from live quotes and orders
    const rfqs = [...rfqMap.values()]
      .map((rfq) => {
        const matchingOrders = orders.filter((o) => o.requestId === rfq.id && o.status !== "CANCELLED");
        const matchingQuotes = quotes.filter((q) => q.requestId === rfq.id);
        let status = "Open for Quotes";
        if (matchingOrders.some((o) => o.status === "CONFIRMED")) {
          status = "Order Confirmed";
        } else if (matchingOrders.some((o) => o.status === "PENDING_FACTORY_CONFIRMATION")) {
          status = "Order Requested";
        } else if (matchingQuotes.length > 0) {
          status = `${matchingQuotes.length} ${matchingQuotes.length === 1 ? "Quote" : "Quotes"} Received`;
        }
        return { ...rfq, status };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const pendingOrders = orders.filter((o) => o.status === "PENDING_FACTORY_CONFIRMATION");
    const confirmedOrders = orders.filter((o) => o.status === "CONFIRMED");
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

    const verifiedFactories = factories.filter((f) => f.verified);
    const pendingFactories = factories.filter((f) => !f.verified);
    const totalFactoryCapacity = factories.reduce(
      (sum, f) => sum + (f.monthlyCapacity > 0 ? f.monthlyCapacity : 0),
      0,
    );
    const totalOrderValue = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.totalValue, 0);
    const confirmedUnits = confirmedOrders.reduce((sum, o) => sum + o.quantityNum, 0);

    // 7. Live KPIs
    const kpis: KPIStat[] = [
      {
        id: "total-users",
        title: "Total Users",
        value: users.length.toLocaleString(),
        numericValue: users.length,
        comparisonText: `${buyers.length} buyers · ${factories.length} factories`,
        trend: users.length > 0 ? "up" : "neutral",
        trendPercent: `${users.length} active`,
        iconName: "Users",
        href: "/admin/administrators",
        accentColor: "blue",
      },
      {
        id: "total-factories",
        title: "Total Factories",
        value: factories.length.toLocaleString(),
        numericValue: factories.length,
        comparisonText: totalFactoryCapacity > 0
          ? `${totalFactoryCapacity.toLocaleString()} pcs/mo total capacity`
          : `${verifiedFactories.length} verified partners`,
        trend: factories.length > 0 ? "up" : "neutral",
        trendPercent: `${verifiedFactories.length} verified`,
        iconName: "Factory",
        href: "/admin/factories",
        accentColor: "navy",
      },
      {
        id: "total-buyers",
        title: "Total Buyers",
        value: buyers.length.toLocaleString(),
        numericValue: buyers.length,
        comparisonText: `${rfqs.length} submitted requests`,
        trend: buyers.length > 0 ? "up" : "neutral",
        trendPercent: `${buyers.length} active`,
        iconName: "ShoppingBag",
        href: "/admin/buyers",
        accentColor: "purple",
      },
      {
        id: "pending-verifications",
        title: "Pending Verifications",
        value: pendingFactories.length.toLocaleString(),
        numericValue: pendingFactories.length,
        comparisonText: pendingFactories.length > 0
          ? `${pendingFactories.length} factories awaiting verification`
          : "All registered factories verified",
        trend: pendingFactories.length > 0 ? "neutral" : "up",
        trendPercent: pendingFactories.length > 0 ? "Action Req." : "Up to date",
        iconName: "FileCheck2",
        href: "/admin/verifications",
        accentColor: "amber",
      },
      {
        id: "total-rfqs",
        title: "Total RFQs",
        value: rfqs.length.toLocaleString(),
        numericValue: rfqs.length,
        comparisonText: `${quotes.length} quotations submitted`,
        trend: rfqs.length > 0 ? "up" : "neutral",
        trendPercent: `${quotes.length} quotes`,
        iconName: "FileText",
        href: "/admin/rfqs",
        accentColor: "blue",
      },
      {
        id: "active-orders",
        title: "Awaiting Confirmation",
        value: pendingOrders.length.toLocaleString(),
        numericValue: pendingOrders.length,
        comparisonText: "Buyer orders awaiting factory approval",
        trend: pendingOrders.length > 0 ? "neutral" : "up",
        trendPercent: pendingOrders.length > 0 ? "Pending" : "Clear",
        iconName: "Clock3",
        href: "/admin/orders",
        accentColor: "amber",
      },
      {
        id: "completed-orders",
        title: "Confirmed Orders",
        value: confirmedOrders.length.toLocaleString(),
        numericValue: confirmedOrders.length,
        comparisonText: `${confirmedUnits.toLocaleString()} pcs booked across factories`,
        trend: confirmedOrders.length > 0 ? "up" : "neutral",
        trendPercent: orders.length > 0
          ? `${Math.round((confirmedOrders.length / orders.length) * 100)}% rate`
          : "0%",
        iconName: "CheckCircle2",
        href: "/admin/orders",
        accentColor: "green",
      },
      {
        id: "platform-gmt",
        title: "Platform Order Value",
        value: formatCurrencyCompact(totalOrderValue),
        numericValue: totalOrderValue,
        comparisonText: `Est. ${platformSettings.commissionRate}% fee: ${formatCurrencyCompact(
          Math.round(totalOrderValue * (platformSettings.commissionRate / 100)),
        )}`,
        trend: totalOrderValue > 0 ? "up" : "neutral",
        trendPercent: `${orders.filter((o) => o.status !== "CANCELLED").length} orders`,
        iconName: "DollarSign",
        href: "/admin/payments",
        accentColor: "green",
      },
    ];

    // 8. Quick Actions with live badges
    const quickActions: QuickActionItem[] = [
      {
        id: "qa-review-factories",
        title: "Review Factory Applications",
        description: pendingFactories.length
          ? `${pendingFactories.length} manufacturing ${pendingFactories.length === 1 ? "partner" : "partners"} waiting for verification.`
          : "Manage factory compliance and profile approvals.",
        badge: pendingFactories.length ? `${pendingFactories.length} Pending` : undefined,
        iconName: "BadgeCheck",
        href: "/admin/verifications",
        priority: pendingFactories.length > 0 ? "high" : "normal",
      },
      {
        id: "qa-manage-users",
        title: "Manage Buyers & Factories",
        description: `Inspect ${buyers.length} buyer and ${factories.length} factory accounts live.`,
        badge: users.length ? `${users.length} Users` : undefined,
        iconName: "ShieldCheck",
        href: "/admin/factories",
      },
      {
        id: "qa-rfqs",
        title: "Inspect Open RFQs",
        description: `${rfqs.length} production requests and ${quotes.length} factory quotations.`,
        badge: rfqs.length ? `${rfqs.length} RFQs` : undefined,
        iconName: "AlertTriangle",
        href: "/admin/rfqs",
      },
      {
        id: "qa-orders",
        title: "Monitor Orders & Confirmations",
        description: `${pendingOrders.length} awaiting confirmation · ${confirmedOrders.length} confirmed.`,
        badge: pendingOrders.length ? `${pendingOrders.length} Awaiting` : `${confirmedOrders.length} Active`,
        iconName: "Scale",
        href: "/admin/orders",
        priority: pendingOrders.length > 0 ? "high" : "normal",
      },
      {
        id: "qa-reports",
        title: "Analytics & Order Ledger",
        description: "Review live volume metrics and export CSV reports.",
        iconName: "FileSpreadsheet",
        href: "/admin/analytics",
      },
    ];

    // 9. 12-Month Trend from live orders + quotes
    const feeFraction = (platformSettings.commissionRate ?? 5) / 100;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const transactionTrend: MonthlyChartData[] = monthNames.map((month, idx) => {
      const monthOrders = orders.filter((o) => {
        if (o.status === "CANCELLED") return false;
        const parsed = new Date(o.createdAt);
        return !Number.isNaN(parsed.getTime()) && parsed.getMonth() === idx;
      });
      const volDollars = monthOrders.reduce((s, o) => s + o.totalValue, 0);
      const volThousands = Math.round((volDollars / 1000) * 10) / 10;
      const revThousands = Math.round(((volDollars * feeFraction) / 1000) * 10) / 10;
      return {
        month,
        volume: volThousands,
        revenue: revThousands,
        ordersCount: monthOrders.length,
      };
    });

    // 10. Order Status Breakdown
    const quotedOnlyRfqs = rfqs.filter((r) => r.status.includes("Quote")).length;
    const openRfqs = rfqs.filter((r) => r.status === "Open for Quotes").length;
    const totalPipelineItems = Math.max(
      1,
      confirmedOrders.length + pendingOrders.length + quotedOnlyRfqs + openRfqs + cancelledOrders.length,
    );
    const orderStatusBreakdown: StatusDistributionData[] = [
      {
        status: "Confirmed Orders",
        count: confirmedOrders.length,
        color: "#16A36A",
        percentage: Math.round((confirmedOrders.length / totalPipelineItems) * 100),
      },
      {
        status: "Awaiting Factory Confirmation",
        count: pendingOrders.length,
        color: "#F59E0B",
        percentage: Math.round((pendingOrders.length / totalPipelineItems) * 100),
      },
      {
        status: "Quoted RFQs (Buyer Decision)",
        count: quotedOnlyRfqs,
        color: "#3B82F6",
        percentage: Math.round((quotedOnlyRfqs / totalPipelineItems) * 100),
      },
      {
        status: "Open RFQs (Awaiting Quotes)",
        count: openRfqs,
        color: "#8B5CF6",
        percentage: Math.round((openRfqs / totalPipelineItems) * 100),
      },
      {
        status: "Cancelled Orders",
        count: cancelledOrders.length,
        color: "#EF4444",
        percentage: Math.round((cancelledOrders.length / totalPipelineItems) * 100),
      },
    ];

    // 11. Factory Compliance Breakdown
    const totalFactoriesDenom = Math.max(1, factories.length);
    const completeProfileFactories = factories.filter(
      (f) => f.companyName && f.country !== "Not specified" && f.monthlyCapacity > 0 && f.products.length > 0,
    ).length;
    const withCoverCount = factories.filter((f) => Boolean(f.coverPhotoURL)).length;
    const verificationBreakdown: StatusDistributionData[] = [
      {
        status: "Verified Factories",
        count: verifiedFactories.length,
        color: "#16A36A",
        percentage: Math.round((verifiedFactories.length / totalFactoriesDenom) * 100),
      },
      {
        status: "Pending Admin Verification",
        count: pendingFactories.length,
        color: "#F59E0B",
        percentage: Math.round((pendingFactories.length / totalFactoriesDenom) * 100),
      },
      {
        status: "Complete Production Profiles",
        count: completeProfileFactories,
        color: "#3B82F6",
        percentage: Math.round((completeProfileFactories / totalFactoriesDenom) * 100),
      },
      {
        status: "Custom Banner Added",
        count: withCoverCount,
        color: "#8B5CF6",
        percentage: Math.round((withCoverCount / totalFactoriesDenom) * 100),
      },
    ];

    // 12. Real Recent Activity Feed (Orders + Quotes + RFQs + Factories + Buyers)
    const activityItems: RecentActivityItem[] = [
      ...orders.map((o): RecentActivityItem => ({
        id: `order-${o.id}`,
        category: "order",
        title:
          o.status === "CONFIRMED"
            ? `Order Confirmed: ${o.product} (${o.quantityText})`
            : o.status === "PENDING_FACTORY_CONFIRMATION"
              ? `Order Requested: ${o.product} (${o.quantityText})`
              : `Order Cancelled: ${o.product}`,
        subtitle: `${o.buyerName} -> ${o.factoryName} · ${o.currency} ${o.pricePerUnit.toFixed(2)}/unit · Est. $${o.totalValue.toLocaleString()}`,
        timestamp: o.updatedAt || o.createdAt,
        relativeTime: formatRelativeTime(o.updatedAt || o.createdAt),
        status:
          o.status === "CONFIRMED"
            ? "Confirmed"
            : o.status === "PENDING_FACTORY_CONFIRMATION"
              ? "Awaiting Factory"
              : "Cancelled",
        statusTone:
          o.status === "CONFIRMED"
            ? "success"
            : o.status === "PENDING_FACTORY_CONFIRMATION"
              ? "warning"
              : "danger",
        actionLabel: "View Orders",
        actionHref: "/admin/orders",
        avatarText: o.factoryName.slice(0, 2).toUpperCase() || "OR",
      })),
      ...quotes.map((q): RecentActivityItem => ({
        id: `quote-${q.id}`,
        category: "quotation",
        title: `Quotation Sent by ${q.factoryName}: ${q.product}`,
        subtitle: `For ${q.buyerName} (${q.requestId}) · ${q.currency} ${q.pricePerUnit.toFixed(2)}/unit · Lead time: ${q.leadTime}`,
        timestamp: q.createdAt,
        relativeTime: formatRelativeTime(q.createdAt),
        status: "Quote Shared",
        statusTone: "info",
        actionLabel: "View Quotes",
        actionHref: "/admin/quotations",
        avatarText: q.factoryName.slice(0, 2).toUpperCase() || "QT",
      })),
      ...rfqs.map((r): RecentActivityItem => ({
        id: `rfq-${r.id}`,
        category: "rfq",
        title: `Buyer RFQ: ${r.title} (${r.quantityText})`,
        subtitle: `Submitted by ${r.buyerName} (${r.location}) · Target delivery: ${r.deadline}`,
        timestamp: r.createdAt,
        relativeTime: formatRelativeTime(r.createdAt),
        status: r.status,
        statusTone: r.status === "Order Confirmed" ? "success" : r.status === "Order Requested" ? "warning" : "info",
        actionLabel: "Inspect RFQ",
        actionHref: "/admin/rfqs",
        avatarText: r.buyerName.slice(0, 2).toUpperCase() || "RQ",
      })),
      ...factories.map((f): RecentActivityItem => ({
        id: `fac-${f.id}`,
        category: f.verified ? "factory" : "verification",
        title: `${f.companyName} (${f.city ? `${f.city}, ` : ""}${f.country})`,
        subtitle: `Contact: ${f.fullName} · Capacity: ${f.monthlyCapacity.toLocaleString()} pcs/mo · ${f.email}`,
        timestamp: f.updatedAt,
        relativeTime: formatRelativeTime(f.updatedAt),
        status: f.verified ? "Verified" : "Pending Verification",
        statusTone: f.verified ? "success" : "warning",
        actionLabel: f.verified ? "View Factory" : "Verify Factory",
        actionHref: f.verified ? "/admin/factories" : "/admin/verifications",
        avatarText: f.companyName.slice(0, 2).toUpperCase() || "FA",
      })),
      ...buyers.map((b): RecentActivityItem => ({
        id: `buy-${b.id}`,
        category: "buyer",
        title: `Buyer Account: ${b.companyName}`,
        subtitle: `${b.fullName} (${b.buyerType}) · ${b.country} · ${b.email}`,
        timestamp: b.updatedAt,
        relativeTime: formatRelativeTime(b.updatedAt),
        status: "Active Buyer",
        statusTone: "success",
        actionLabel: "View Buyer",
        actionHref: "/admin/buyers",
        avatarText: b.companyName.slice(0, 2).toUpperCase() || "BU",
      })),
    ].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

    // 13. Real Notifications built from current state
    const notifications: AdminNotification[] = [
      ...pendingOrders.slice(0, 3).map((o) => ({
        id: `notif-order-${o.id}`,
        title: `Order Awaiting Factory Confirmation (${o.id})`,
        description: `${o.buyerName} requested ${o.quantityText} of ${o.product} from ${o.factoryName}.`,
        type: "order" as const,
        unread: !readNotifIds.includes(`notif-order-${o.id}`),
        time: formatRelativeTime(o.createdAt),
        href: "/admin/orders",
      })),
      ...pendingFactories.slice(0, 3).map((f) => ({
        id: `notif-verify-${f.id}`,
        title: `Factory Verification Pending: ${f.companyName}`,
        description: `${f.fullName} (${f.country}) is awaiting admin verification review.`,
        type: "verification" as const,
        unread: !readNotifIds.includes(`notif-verify-${f.id}`),
        time: formatRelativeTime(f.updatedAt),
        href: "/admin/verifications",
      })),
      ...confirmedOrders.slice(0, 2).map((o) => ({
        id: `notif-confirmed-${o.id}`,
        title: `Confirmed Production Order (${o.id})`,
        description: `${o.factoryName} confirmed ${o.quantityText} for ${o.buyerName}.`,
        type: "payment" as const,
        unread: !readNotifIds.includes(`notif-confirmed-${o.id}`),
        time: formatRelativeTime(o.updatedAt),
        href: "/admin/orders",
      })),
    ];

    const unreadNotifCount = notifications.filter((n) => n.unread).length;
    const sidebarBadges: Record<string, string | number | undefined> = {
      factories: factories.length || undefined,
      buyers: buyers.length || undefined,
      verifications: pendingFactories.length || undefined,
      rfqs: rfqs.length || undefined,
      quotations: quotes.length || undefined,
      orders: orders.filter((o) => o.status !== "CANCELLED").length || undefined,
      notifications: unreadNotifCount || undefined,
      administrators: users.filter((u) => u.role === "ADMIN").length || undefined,
    };

    return {
      adminProfile,
      factories,
      buyers,
      users,
      rfqs,
      quotes,
      orders,
      kpis,
      quickActions,
      transactionTrend,
      orderStatusBreakdown,
      verificationBreakdown,
      activities: activityItems,
      notifications,
      sidebarBadges,
      totalOrderValue,
    };
  }, [
    hasMounted,
    localAccountsVersion,
    remoteFactories,
    remoteBuyers,
    remoteUsers,
    remotePublicRfqs,
    localRfqs,
    localQuotes,
    localOrders,
    verificationOverrides,
    readNotifIds,
    platformSettings,
  ]);

  return (
    <AdminDataContext.Provider
      value={{
        ...computed,
        hasMounted,
        adminTheme,
        platformSettings,
        isRefreshing,
        lastRefreshed,
        toggleFactoryVerification,
        markNotificationRead,
        markAllNotificationsRead,
        saveAdminProfile,
        changeAdminTheme,
        updatePlatformSettings,
        clearVerificationOverrides,
        clearReadNotifications,
        resetAdminAccount,
        deleteAdminAccount,
        refreshAll,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error("useAdminData must be used inside AdminDataProvider");
  }
  return ctx;
}
