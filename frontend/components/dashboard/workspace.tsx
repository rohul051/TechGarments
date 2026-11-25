"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  Factory,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { ensureFirebaseAccountSession, findAccount, getRegisteredAccounts, waitForFirebaseUser } from "@/lib/auth";
import { loadBuyerSavedFactories, persistBuyerSavedFactories } from "@/lib/buyerSettings";
import { auth, db } from "@/lib/firebase";
import type { BuyerProfileDetails, BuyerTheme, FactoryProfileDetails } from "@/types/user";
import { BuyerSettingsPage } from "./BuyerSettingsPage";

export type DashboardRole = "buyer" | "factory";

type NavItem = { label: string; icon: LucideIcon };
type BuyerRequestRow = {
  id: string;
  product: string;
  quantity: string;
  deadline: string;
  status: string;
  tone: string;
  responseCount?: number;
  ownerId?: string;
  ownerEmail?: string;
  createdAt?: string;
  category?: string;
  buyerName?: string;
  location?: string;
  fabric?: string;
  process?: string | string[];
  budget?: string;
  quality?: string;
  instructions?: string;
  referenceFiles?: File[];
  isOnline?: boolean;
};
type RequestSubmissionResult = {
  shared: boolean;
  message: string;
};
type StoredQuote = {
  id: string;
  requestId: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  factoryId: string;
  factoryEmail: string;
  factoryName: string;
  factoryLocation: string;
  product: string;
  quantity: string;
  pricePerUnit: number;
  currency: string;
  leadTime: string;
  terms: string;
  status: "PENDING";
  createdAt: string;
  category?: string;
  targetDeliveryDate?: string;
  isOnline?: boolean;
};
type DashboardOrder = {
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
  quantity: string;
  targetDeliveryDate: string;
  pricePerUnit: number;
  currency: string;
  terms: string;
  status: "PENDING_FACTORY_CONFIRMATION" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  isOnline?: boolean;
};
type BuyerQuoteView = {
  id: string;
  factory: string;
  location: string;
  product: string;
  price: string;
  delivery: string;
  status: string;
  tone: string;
  quote?: StoredQuote;
};
type FactoryCard = {
  id: string;
  email: string;
  name: string;
  city: string;
  country: string;
  monthlyCapacity: number | null;
  processes: string[];
  products: string[];
  image: string;
  website: string;
  verified: boolean;
};

type FactoryOpportunity = {
  id: string;
  buyer: string;
  buyerId?: string;
  buyerEmail?: string;
  isOnline?: boolean;
  product: string;
  quantity: string;
  deadline: string;
  location: string;
  category?: string;
  fabric?: string;
  processes?: string[];
  budget?: string;
  quality?: string;
  instructions?: string;
  referenceFileNames?: string[];
  referenceFiles?: File[];
  match?: number;
  createdAt?: string;
};

type FactoryDirectoryRecord = {
  id?: unknown;
  email?: unknown;
  fullName?: unknown;
  companyName?: unknown;
  city?: unknown;
  country?: unknown;
  monthlyCapacity?: unknown;
  processes?: unknown;
  products?: unknown;
  website?: unknown;
  verified?: unknown;
};

const genericFactoryImage = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80";

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))]
    : [];
}

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toFactoryCard(profile: FactoryDirectoryRecord, documentId: string): FactoryCard {
  const parsedCapacity = Number(profile.monthlyCapacity);
  const email = getText(profile.email).toLowerCase();
  return {
    id: email ? `factory:${email}` : getText(profile.id) || documentId,
    email,
    name: getText(profile.companyName) || getText(profile.fullName) || "Factory name not provided",
    city: getText(profile.city),
    country: getText(profile.country),
    monthlyCapacity: Number.isFinite(parsedCapacity) && parsedCapacity > 0 ? parsedCapacity : null,
    processes: getStringList(profile.processes),
    products: getStringList(profile.products),
    image: genericFactoryImage,
    website: getText(profile.website),
    verified: profile.verified === true,
  };
}

function getLocalFactoryCards(): FactoryCard[] {
  const factories = new Map<string, FactoryCard>();
  for (const account of Object.values(getRegisteredAccounts())) {
    if (account.role !== "FACTORY") continue;
    const card = toFactoryCard(account, `local:${account.email.toLowerCase()}`);
    factories.set(card.email || card.id, card);
  }
  return [...factories.values()];
}

function mergeFactoryCards(remoteFactories: FactoryCard[], localFactories: FactoryCard[]): FactoryCard[] {
  const factories = new Map<string, FactoryCard>();
  for (const factory of remoteFactories) {
    factories.set(factory.email || factory.id, factory);
  }
  for (const factory of localFactories) {
    const key = factory.email || factory.id;
    const remoteFactory = factories.get(key);
    factories.set(key, remoteFactory
      ? {
          ...remoteFactory,
          name: factory.name || remoteFactory.name,
          city: factory.city || remoteFactory.city,
          country: factory.country || remoteFactory.country,
          monthlyCapacity: factory.monthlyCapacity ?? remoteFactory.monthlyCapacity,
          processes: factory.processes.length ? factory.processes : remoteFactory.processes,
          products: factory.products.length ? factory.products : remoteFactory.products,
          website: factory.website || remoteFactory.website,
        }
      : factory);
  }
  return [...factories.values()];
}

function toFactoryOpportunity(request: BuyerRequestRow): FactoryOpportunity {
  const processes = Array.isArray(request.process)
    ? request.process
    : request.process
      ? [request.process]
      : [];
  return {
    id: request.id,
    buyer: request.buyerName || request.ownerEmail || "Garment buyer",
    buyerId: request.ownerId,
    buyerEmail: request.ownerEmail,
    isOnline: request.isOnline,
    product: request.product,
    quantity: request.quantity,
    deadline: request.deadline,
    location: request.location || "Location not provided",
    category: request.category,
    fabric: request.fabric,
    processes,
    budget: request.budget,
    quality: request.quality,
    instructions: request.instructions,
    referenceFileNames: request.referenceFiles?.map((file) => file.name) || [],
    referenceFiles: request.referenceFiles,
    createdAt: request.createdAt,
  };
}

function toRemoteFactoryOpportunity(data: Record<string, unknown>, documentId: string): FactoryOpportunity | null {
  const product = getText(data.title) || getText(data.productType);
  if (!product) return null;
  const specifications = getRecord(data.specifications);

  const parsedQuantity = Number(data.quantity);
  const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0
    ? `${parsedQuantity.toLocaleString()} pcs`
    : "Quantity not provided";
  const date = getText(data.targetDeliveryDate) || getText(data.deadline);
  const parsedDate = new Date(date);
  const deadline = date && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : date || "Not specified";

  return {
    id: getText(data.requestId) || documentId,
    buyer: getText(data.buyerName) || getText(data.buyerEmail) || "Garment buyer",
    buyerId: getText(data.buyerId),
    buyerEmail: getText(data.buyerEmail),
    isOnline: true,
    product,
    quantity,
    deadline,
    location: getText(data.location) || "Location not provided",
    category: getText(specifications.category) || getText(data.productType),
    fabric: getText(specifications.fabricType),
    processes: getStringList(specifications.processes),
    budget: data.targetPricePerUnit == null ? "" : String(data.targetPricePerUnit),
    quality: getText(specifications.quality),
    instructions: getText(specifications.additionalNotes),
    referenceFileNames: getStringList(specifications.referenceFileNames),
    createdAt: getText(data.createdAt),
  };
}

const buyerNav: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Find Factories", icon: Search },
  { label: "Post Production Request", icon: Plus },
  { label: "My Requests", icon: ClipboardList },
  { label: "Received Quotations", icon: FileText },
  { label: "My Orders", icon: Package },
  { label: "Messages", icon: MessageSquare },
  { label: "Saved Factories", icon: Bookmark },
  { label: "Company Profile", icon: Building2 },
  { label: "Settings", icon: Settings },
];

const factoryNav: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Factory Profile", icon: Factory },
  { label: "Manufacturing Capabilities", icon: SlidersHorizontal },
  { label: "Available Capacity", icon: Gauge },
  { label: "Production Requests", icon: ClipboardList },
  { label: "Received Orders", icon: Package },
  { label: "My Quotations", icon: FileText },
  { label: "Production Management", icon: Activity },
  { label: "Messages", icon: MessageSquare },
  { label: "Reviews & Ratings", icon: Star },
  { label: "Verification Documents", icon: ShieldCheck },
  { label: "Settings", icon: Settings },
];

const buyerStats = [
  { label: "Active requests", value: "08", change: "+2 this week", icon: ClipboardList, color: "mint", trend: "up" },
  { label: "Received quotations", value: "24", change: "6 awaiting review", icon: FileText, color: "blue", trend: "up" },
  { label: "Active orders", value: "03", change: "On track", icon: Package, color: "violet", trend: "steady" },
  { label: "AI matched factories", value: "16", change: "New matches today", icon: SparkIcon, color: "amber", trend: "up" },
];

const factoryStats = [
  { label: "Monthly capacity", value: "120k", suffix: "pcs", change: "Across 3 product lines", icon: Gauge, color: "mint", trend: "steady" },
  { label: "Available capacity", value: "38k", suffix: "pcs", change: "32% of total capacity", icon: Activity, color: "blue", trend: "up" },
  { label: "New buyer requests", value: "12", change: "4 match your capabilities", icon: Mail, color: "amber", trend: "up" },
  { label: "Active orders", value: "07", change: "2 due this month", icon: Package, color: "violet", trend: "steady" },
];

function SparkIcon(props: React.ComponentProps<typeof Star>) {
  return <Star {...props} />;
}

const requestRows: BuyerRequestRow[] = [
  { id: "RFQ-3481", product: "Organic cotton tees", quantity: "5,000 pcs", deadline: "Dec 18, 2026", status: "Quotations received", tone: "teal", responseCount: 3 },
  { id: "RFQ-3476", product: "Classic pique polos", quantity: "2,400 pcs", deadline: "Dec 29, 2026", status: "In review", tone: "blue", responseCount: 0 },
  { id: "RFQ-3469", product: "Relaxed-fit denim", quantity: "1,800 pcs", deadline: "Jan 08, 2027", status: "Matching", tone: "amber", responseCount: 1 },
  { id: "RFQ-3458", product: "Linen blend shirts", quantity: "3,200 pcs", deadline: "Jan 22, 2027", status: "Quotations received", tone: "teal", responseCount: 5 },
];

const requestDatabaseName = "garmentconnect-production-requests";
const requestStoreName = "requests";

function openRequestDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(requestDatabaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(requestStoreName)) {
        request.result.createObjectStore(requestStoreName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open request storage."));
  });
}

function loadProductionRequests(ownerId: string, ownerEmail: string): Promise<BuyerRequestRow[]> {
  return openRequestDatabase().then((database) => new Promise<BuyerRequestRow[]>((resolve, reject) => {
    const transaction = database.transaction(requestStoreName, "readonly");
    const request = transaction.objectStore(requestStoreName).getAll() as IDBRequest<BuyerRequestRow[]>;
    request.onsuccess = () => {
      database.close();
      resolve(request.result
        .filter((record) =>
          record.ownerId === ownerId || record.ownerEmail?.toLowerCase() === ownerEmail,
        )
        .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? "")));
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("Could not load saved requests."));
    };
  }));
}

function loadAllProductionRequests(): Promise<BuyerRequestRow[]> {
  return openRequestDatabase().then((database) => new Promise<BuyerRequestRow[]>((resolve, reject) => {
    const transaction = database.transaction(requestStoreName, "readonly");
    const request = transaction.objectStore(requestStoreName).getAll() as IDBRequest<BuyerRequestRow[]>;
    request.onsuccess = () => {
      database.close();
      resolve(request.result.sort((left, right) =>
        (right.createdAt ?? "").localeCompare(left.createdAt ?? ""),
      ));
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("Could not load shared production requests."));
    };
  }));
}

function saveProductionRequest(requestRow: BuyerRequestRow): Promise<void> {
  return openRequestDatabase().then((database) => new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(requestStoreName, "readwrite");
    transaction.objectStore(requestStoreName).put(requestRow);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not save the production request."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Saving the production request was cancelled."));
    };
  }));
}

const quoteDatabaseName = "garmentconnect-production-quotes";
const quoteStoreName = "quotes";

function openQuoteDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(quoteDatabaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(quoteStoreName)) {
        request.result.createObjectStore(quoteStoreName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open quotation storage."));
  });
}

function saveStoredQuote(quote: StoredQuote): Promise<void> {
  return openQuoteDatabase().then((database) => new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(quoteStoreName, "readwrite");
    transaction.objectStore(quoteStoreName).put(quote);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not save the quotation."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Saving the quotation was cancelled."));
    };
  }));
}

function loadStoredQuotes(
  role: DashboardRole,
  userId: string,
  userEmail: string,
): Promise<StoredQuote[]> {
  return openQuoteDatabase().then((database) => new Promise<StoredQuote[]>((resolve, reject) => {
    const transaction = database.transaction(quoteStoreName, "readonly");
    const request = transaction.objectStore(quoteStoreName).getAll() as IDBRequest<StoredQuote[]>;
    request.onsuccess = () => {
      database.close();
      const email = userEmail.trim().toLowerCase();
      resolve(request.result
        .filter((quote) => role === "buyer"
          ? quote.buyerId === userId || quote.buyerEmail.toLowerCase() === email
          : quote.factoryId === userId || quote.factoryEmail.toLowerCase() === email)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("Could not load saved quotations."));
    };
  }));
}

function notifyQuotesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("garmentconnect:quotes-updated"));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("garmentconnect-production-quotes");
    channel.postMessage("updated");
    channel.close();
  }
}

const orderDatabaseName = "garmentconnect-orders";
const orderStoreName = "orders";

function openOrderDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(orderDatabaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(orderStoreName)) {
        request.result.createObjectStore(orderStoreName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open order storage."));
  });
}

function saveDashboardOrder(order: DashboardOrder): Promise<void> {
  return openOrderDatabase().then((database) => new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(orderStoreName, "readwrite");
    transaction.objectStore(orderStoreName).put(order);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not save the order request."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Saving the order request was cancelled."));
    };
  }));
}

function loadDashboardOrders(role: DashboardRole, userId: string, userEmail: string): Promise<DashboardOrder[]> {
  return openOrderDatabase().then((database) => new Promise<DashboardOrder[]>((resolve, reject) => {
    const transaction = database.transaction(orderStoreName, "readonly");
    const request = transaction.objectStore(orderStoreName).getAll() as IDBRequest<DashboardOrder[]>;
    request.onsuccess = () => {
      database.close();
      const email = userEmail.trim().toLowerCase();
      resolve(request.result
        .filter((order) => role === "buyer"
          ? order.buyerId === userId || order.buyerEmail.toLowerCase() === email
          : order.factoryId === userId || order.factoryEmail.toLowerCase() === email)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("Could not load saved order requests."));
    };
  }));
}

function mergeDashboardOrders(current: DashboardOrder[], incoming: DashboardOrder[]): DashboardOrder[] {
  const orders = new Map(current.map((order) => [order.id, order]));
  for (const order of incoming) {
    const existing = orders.get(order.id);
    if (!existing) {
      orders.set(order.id, order);
      continue;
    }
    const useIncomingStatus =
      order.status === "CONFIRMED" ||
      order.status === "CANCELLED" ||
      (order.updatedAt || "").localeCompare(existing.updatedAt || "") >= 0;
    orders.set(order.id, {
      ...existing,
      ...order,
      isOnline: Boolean(existing.isOnline || order.isOnline),
      status: useIncomingStatus ? order.status : existing.status,
      updatedAt: useIncomingStatus ? order.updatedAt : existing.updatedAt,
    });
  }
  return [...orders.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function notifyOrdersUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("garmentconnect:orders-updated"));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("garmentconnect-orders");
    channel.postMessage("updated");
    channel.close();
  }
}

async function shareProductionRequest(
  requestRow: BuyerRequestRow,
  buyerId: string,
): Promise<void> {
  const quantity = Number(requestRow.quantity.replace(/[^\d]/g, ""));
  const processes = Array.isArray(requestRow.process)
    ? requestRow.process
    : requestRow.process
      ? [requestRow.process]
      : [];
  const now = new Date().toISOString();

  await setDoc(doc(db, "orders", requestRow.id), {
    id: requestRow.id,
    requestId: requestRow.id,
    title: requestRow.product,
    buyerId,
    buyerName: requestRow.buyerName || "Garment buyer",
    buyerEmail: requestRow.ownerEmail || "",
    factoryId: null,
    productType: requestRow.category || "Other",
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
    targetDeliveryDate: requestRow.deadline,
    deadline: requestRow.deadline,
    targetPricePerUnit: requestRow.budget ? Number(requestRow.budget) : null,
    currency: "USD",
    status: "PENDING_QUOTE",
    location: requestRow.location || "",
    specifications: {
      category: requestRow.category || "",
      fabricType: requestRow.fabric || "",
      processes,
      quality: requestRow.quality || "",
      additionalNotes: requestRow.instructions || "",
      referenceFileNames: requestRow.referenceFiles?.map((file) => file.name) || [],
    },
    createdAt: requestRow.createdAt || now,
    updatedAt: now,
  });
}

function mergeFactoryOpportunities(
  current: FactoryOpportunity[],
  incoming: FactoryOpportunity[],
): FactoryOpportunity[] {
  const opportunities = new Map(current.map((request) => [request.id, request]));
  for (const request of incoming) {
    opportunities.set(request.id, { ...opportunities.get(request.id), ...request });
  }
  return [...opportunities.values()].sort((left, right) =>
    (right.createdAt ?? "").localeCompare(left.createdAt ?? ""),
  );
}

function notifyProductionRequestCreated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("garmentconnect:production-requests-updated"));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("garmentconnect-production-requests");
    channel.postMessage("updated");
    channel.close();
  }
}

const quotationRows: BuyerQuoteView[] = [
  { id: "demo-1", factory: "Evergreen Apparel Ltd.", location: "Dhaka, Bangladesh", product: "Organic cotton tees", price: "$4.20 / unit", delivery: "35 days", status: "Best match", tone: "teal" },
  { id: "demo-2", factory: "Meridian Garments", location: "Dhaka, Bangladesh", product: "Classic pique polos", price: "$5.65 / unit", delivery: "42 days", status: "New quote", tone: "blue" },
  { id: "demo-3", factory: "Thread & Loom Works", location: "Dhaka, Bangladesh", product: "Linen blend shirts", price: "$8.10 / unit", delivery: "38 days", status: "Under review", tone: "amber" },
  { id: "demo-4", factory: "Sunrise Manufacturing", location: "Dhaka, Bangladesh", product: "Organic cotton tees", price: "$4.45 / unit", delivery: "32 days", status: "Shortlisted", tone: "violet" },
];

function toBuyerQuoteView(quote: StoredQuote, orders: DashboardOrder[] = []): BuyerQuoteView {
  const matchingOrder = orders.find((order) => order.quoteId === quote.id && order.status !== "CANCELLED");
  const status = matchingOrder?.status === "CONFIRMED"
    ? "Confirmed"
    : matchingOrder?.status === "PENDING_FACTORY_CONFIRMATION"
      ? "Order requested"
      : "New quote";
  const tone = matchingOrder?.status === "CONFIRMED"
    ? "teal"
    : matchingOrder?.status === "PENDING_FACTORY_CONFIRMATION"
      ? "violet"
      : "blue";

  return {
    id: quote.id,
    factory: quote.factoryName,
    location: quote.factoryLocation || "Location not provided",
    product: quote.product,
    price: `${quote.currency} ${quote.pricePerUnit.toFixed(2)} / unit`,
    delivery: quote.leadTime,
    status,
    tone,
    quote,
  };
}

function enrichBuyerRequestRow(
  row: BuyerRequestRow,
  quotes: StoredQuote[],
  orders: DashboardOrder[],
): BuyerRequestRow {
  const matchingQuotes = quotes.filter((quote) => quote.requestId === row.id);
  const matchingOrders = orders.filter((order) => order.requestId === row.id && order.status !== "CANCELLED");
  const responseCount = Math.max(row.responseCount ?? 0, matchingQuotes.length);

  if (matchingOrders.some((order) => order.status === "CONFIRMED")) {
    return { ...row, responseCount, status: "Order confirmed", tone: "teal" };
  }
  if (matchingOrders.some((order) => order.status === "PENDING_FACTORY_CONFIRMATION")) {
    return { ...row, responseCount, status: "Order requested", tone: "blue" };
  }
  if (matchingQuotes.length > 0) {
    return { ...row, responseCount, status: "Quotations received", tone: "teal" };
  }
  return { ...row, responseCount };
}

function toStoredQuote(data: Record<string, unknown>, documentId: string): StoredQuote | null {
  const pricePerUnit = Number(data.pricePerUnit);
  const requestId = getText(data.requestId);
  const product = getText(data.product);
  if (!requestId || !product || !Number.isFinite(pricePerUnit) || pricePerUnit <= 0) return null;
  return {
    id: documentId,
    requestId,
    buyerId: getText(data.buyerId),
    buyerEmail: getText(data.buyerEmail),
    buyerName: getText(data.buyerName),
    factoryId: getText(data.factoryId),
    factoryEmail: getText(data.factoryEmail),
    factoryName: getText(data.factoryName) || "Factory",
    factoryLocation: getText(data.factoryLocation),
    product,
    quantity: getText(data.quantity),
    pricePerUnit,
    currency: getText(data.currency) || "USD",
    leadTime: getText(data.leadTime),
    terms: getText(data.terms),
    status: "PENDING",
    createdAt: getText(data.createdAt),
    category: getText(data.category),
    targetDeliveryDate: getText(data.targetDeliveryDate),
    isOnline: true,
  };
}

function toDashboardOrder(data: Record<string, unknown>, documentId: string): DashboardOrder | null {
  const quoteId = getText(data.quoteId);
  const requestId = getText(data.requestId);
  const status = getText(data.status);
  const pricePerUnit = Number(data.pricePerUnit);
  if (!quoteId || !requestId || !Number.isFinite(pricePerUnit) || pricePerUnit <= 0 ||
      !["PENDING_FACTORY_CONFIRMATION", "CONFIRMED", "CANCELLED"].includes(status)) return null;
  return {
    id: documentId,
    quoteId,
    requestId,
    buyerId: getText(data.buyerId),
    buyerEmail: getText(data.buyerEmail),
    buyerName: getText(data.buyerName),
    factoryId: getText(data.factoryId),
    factoryEmail: getText(data.factoryEmail),
    factoryName: getText(data.factoryName),
    product: getText(data.title) || getText(data.product),
    productType: getText(data.productType) || "Other",
    quantity: getText(data.quantity),
    targetDeliveryDate: getText(data.targetDeliveryDate),
    pricePerUnit,
    currency: getText(data.currency) || "USD",
    terms: getText(data.terms),
    status: status as DashboardOrder["status"],
    createdAt: getText(data.createdAt),
    updatedAt: getText(data.updatedAt),
    isOnline: true,
  };
}

function mergeStoredQuotes(current: StoredQuote[], incoming: StoredQuote[]): StoredQuote[] {
  const quotes = new Map(current.map((quote) => [quote.id, quote]));
  for (const quote of incoming) {
    const existing = quotes.get(quote.id);
    quotes.set(quote.id, existing
      ? { ...existing, ...quote, isOnline: Boolean(existing.isOnline || quote.isOnline) }
      : quote);
  }
  return [...quotes.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

const buyerRequests: FactoryOpportunity[] = [
  { id: "RFQ-4028", buyer: "Northstar Studio", product: "Heavyweight crewneck tee", quantity: "8,000 pcs", deadline: "Dec 18, 2026", location: "Copenhagen, Denmark", match: 98 },
  { id: "RFQ-4021", buyer: "Common Ground Co.", product: "Organic cotton polo", quantity: "3,500 pcs", deadline: "Dec 24, 2026", location: "Portland, USA", match: 94 },
  { id: "RFQ-4014", buyer: "Sunday Supply", product: "Custom embroidered hoodie", quantity: "2,000 pcs", deadline: "Jan 05, 2027", location: "London, UK", match: 89 },
];

const orderRows = [
  { id: "ORD-2804", buyer: "Northstar Studio", product: "Organic cotton tees", quantity: "5,000 pcs", date: "Nov 28, 2026", progress: 72, status: "In production", tone: "blue" },
  { id: "ORD-2798", buyer: "Fieldwork Goods", product: "Relaxed-fit overshirt", quantity: "1,200 pcs", date: "Dec 03, 2026", progress: 46, status: "In production", tone: "blue" },
  { id: "ORD-2786", buyer: "Common Ground Co.", product: "Pique polo shirts", quantity: "2,400 pcs", date: "Nov 20, 2026", progress: 100, status: "Ready to ship", tone: "teal" },
  { id: "ORD-2764", buyer: "Fieldwork Goods", product: "Cotton lounge set", quantity: "900 pcs", date: "Nov 02, 2026", progress: 100, status: "Completed", tone: "teal" },
];

const quotationsFactory = [
  { buyer: "Northstar Studio", product: "Heavyweight crewneck tee", price: "$6.80 / unit", delivery: "40 days", status: "Awaiting response", tone: "amber" },
  { buyer: "Fieldwork Goods", product: "Organic cotton polo", price: "$8.15 / unit", delivery: "35 days", status: "Shortlisted", tone: "teal" },
  { buyer: "Common Ground Co.", product: "Custom hoodie", price: "$12.40 / unit", delivery: "48 days", status: "Negotiating", tone: "blue" },
];

const processOptions = ["Cutting", "Sewing", "Knitting", "Dyeing", "Washing", "Printing", "Embroidery", "Finishing"];
const productOptions = ["T-shirt", "Polo shirt", "Shirt", "Jeans", "Jacket", "Sweater", "Hoodie"];
const factoryProductOptions = [...productOptions, "Activewear", "Other"];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function DashboardBrand() {
  return (
    <div className="workspace-brand">
      <span className="workspace-brand-icon"><Shirt size={19} /></span>
      <span>threadline<span>.</span></span>
    </div>
  );
}

function StatusBadge({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`workspace-badge badge-${tone}`}><span />{children}</span>;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="workspace-section-heading">
      <div>
        {eyebrow && <span className="workspace-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <button className="workspace-text-action" onClick={onAction}>{action}<ArrowRight size={15} /></button>}
    </div>
  );
}

function StatCard({ stat }: { stat: (typeof buyerStats)[number] | (typeof factoryStats)[number] }) {
  const Icon = stat.icon;
  const trend = stat.trend;
  return (
    <article className="workspace-stat-card">
      <div className="stat-topline">
        <span className={`stat-icon-box stat-${stat.color}`}><Icon size={18} /></span>
        <button aria-label={`More about ${stat.label}`} className="icon-quiet"><MoreHorizontal size={19} /></button>
      </div>
      <span className="stat-label">{stat.label}</span>
      <div className="stat-value-line">
        <strong>{stat.value}</strong>
        {"suffix" in stat && <span>{stat.suffix}</span>}
      </div>
      <div className={`stat-change ${trend === "up" ? "change-up" : ""}`}>
        {trend === "up" ? <ArrowUpRight size={13} /> : <CheckCircle2 size={13} />}
        {stat.change}
      </div>
    </article>
  );
}

function FactoryImage({ factory, className = "" }: { factory: FactoryCard; className?: string }) {
  return (
    <div
      className={`factory-image ${className}`}
      role="img"
      aria-label={`${factory.name} apparel manufacturing`}
      style={{ backgroundImage: `linear-gradient(180deg, rgba(16, 36, 48, .02), rgba(16, 36, 48, .18)), url("${factory.image}")` }}
    >
      {factory.verified && <span className="image-verified"><BadgeCheck size={14} /> Verified</span>}
    </div>
  );
}

function FactoryCardView({
  factory,
  saved,
  onSave,
  onContact,
  onMessage,
}: {
  factory: FactoryCard;
  saved: boolean;
  onSave: () => void;
  onContact: () => void;
  onMessage?: () => void;
}) {
  return (
    <article className="factory-card">
      <FactoryImage factory={factory} />
      <div className="factory-card-body">
        <div className="factory-card-title">
          <div>
            <h3>{factory.name}</h3>
            <p><span className="location-pin">⌖</span> {[factory.city, factory.country].filter(Boolean).join(", ") || "Location not provided"}</p>
          </div>
        </div>
        <div className="factory-tags">
          {[...new Set([...factory.processes, ...factory.products])].length
            ? [...new Set([...factory.processes, ...factory.products])].map((tag) => <span key={tag}>{tag}</span>)
            : <span>Capabilities not provided</span>}
        </div>
        <div className="factory-card-meta">
          <span><Activity size={14} /> {factory.monthlyCapacity ? `${factory.monthlyCapacity.toLocaleString()} pcs / month` : "Capacity not provided"}</span>
        </div>
        <div className="factory-card-actions">
          <button className="small-primary" onClick={onContact}>View profile <ArrowRight size={14} /></button>
          {onMessage
            ? <button className="contact-factory-button" onClick={onMessage}><MessageSquare size={14} /> Contact</button>
            : <button className={`save-factory ${saved ? "saved" : ""}`} onClick={onSave} aria-label={saved ? "Remove saved factory" : "Save factory"}>
                {saved ? <Heart size={16} fill="currentColor" /> : <Bookmark size={16} />}
              </button>}
        </div>
      </div>
    </article>
  );
}

function DataTable({
  headers,
  children,
  className = "",
}: {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`workspace-table-wrap ${className}`}>
      <table className="workspace-table">
        <thead><tr>{headers.map((header, index) => <th key={`${header || "col"}-${index}`}>{header}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "plain",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "plain" | "primary";
}) {
  return <button className={`table-action ${variant === "primary" ? "table-action-primary" : ""}`} onClick={onClick}>{children}</button>;
}

function BuyerOverview({
  onNavigate,
  saved,
  onToggleSave,
  onContact,
  onViewFactory,
  firstName,
  requests,
  quotes,
  orders,
  factories,
  factoriesLoading,
  factoryDirectoryError,
}: {
  onNavigate: (label: string) => void;
  saved: string[];
  onToggleSave: (name: string) => void;
  onContact: (title: string) => void;
  onViewFactory: (factory: FactoryCard) => void;
  firstName: string;
  requests: BuyerRequestRow[];
  quotes: StoredQuote[];
  orders: DashboardOrder[];
  factories: FactoryCard[];
  factoriesLoading: boolean;
  factoryDirectoryError: string;
}) {
  const liveOrderCards = orders
    .filter((order) => order.status !== "CANCELLED")
    .map((order) => ({
      id: order.id,
      product: order.product,
      quantity: order.quantity,
      date: order.targetDeliveryDate || "Not specified",
      progress: order.status === "CONFIRMED" ? 25 : 5,
      status: order.status === "CONFIRMED" ? "Confirmed" : "Awaiting factory confirmation",
      tone: order.status === "CONFIRMED" ? "teal" : "amber",
    }));
  const overviewQuotes = [...quotes.map((quote) => toBuyerQuoteView(quote, orders)), ...quotationRows].slice(0, 3);
  const overviewOrders = [...liveOrderCards, ...orderRows].slice(0, 2);

  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="workspace-eyebrow">WEDNESDAY, NOVEMBER 11, 2026</span>
          <h1>Good morning, {firstName} <span>✦</span></h1>
          <p>Here&apos;s what&apos;s happening with your production this week.</p>
        </div>
        <button className="workspace-primary-button" onClick={() => onNavigate("Post Production Request")}><Plus size={16} /> New production request</button>
      </div>
      <div className="workspace-stats">{buyerStats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</div>
      <section className="workspace-section">
        <SectionHeading eyebrow="DISCOVER MANUFACTURERS" title="Registered factory profiles" description="Explore manufacturing profiles registered on GarmentConnect." action="Explore all factories" onAction={() => onNavigate("Find Factories")} />
        {factoryDirectoryError && <p className="factory-directory-notice" role="status">{factoryDirectoryError}</p>}
        <div className="factory-card-grid">
          {factories.slice(0, 3).map((factory) => (
            <FactoryCardView
              key={factory.id}
              factory={factory}
              saved={saved.includes(factory.id)}
              onSave={() => onToggleSave(factory.id)}
              onContact={() => onViewFactory(factory)}
              onMessage={() => onContact(`Contact ${factory.name}`)}
            />
          ))}
          {!factories.length && <p className="factory-directory-notice" role="status">{factoriesLoading ? "Loading registered factory profiles..." : "No registered factory profiles are available yet."}</p>}
        </div>
      </section>
      <div className="workspace-two-col">
        <section className="workspace-panel">
          <SectionHeading title="Recent production requests" action="View all" onAction={() => onNavigate("My Requests")} />
          <DataTable headers={["Request", "Quantity", "Deadline", "Status", ""]}>
            {requests.slice(0, 3).map((row) => (
              <tr key={row.id}>
                <td><strong className="table-main">{row.product}</strong><span className="table-sub">{row.id}</span></td>
                <td>{row.quantity}</td><td>{row.deadline}</td><td><StatusBadge tone={row.tone}>{row.status}</StatusBadge></td>
                <td><ActionButton onClick={() => onNavigate("My Requests")}>Details</ActionButton></td>
              </tr>
            ))}
          </DataTable>
        </section>
        <section className="workspace-panel">
          <SectionHeading title="Recent quotations" action="Compare all" onAction={() => onNavigate("Received Quotations")} />
          <div className="quotation-list">
            {overviewQuotes.map((quote) => (
              <article className="quotation-item" key={quote.id}>
                <span className="quote-avatar">{initials(quote.factory)}</span>
                <div className="quote-info"><strong>{quote.factory}</strong><span>{quote.product}</span><div><b>{quote.price}</b><span> · {quote.delivery}</span><span> · {quote.status}</span></div></div>
                <button className="quote-compare" onClick={() => onNavigate("Received Quotations")}>Compare</button>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="workspace-panel buyer-order-panel">
        <SectionHeading title="Orders in progress" action="Track orders" onAction={() => onNavigate("My Orders")} />
        <div className="order-progress-grid">
          {overviewOrders.map((order) => (
            <div className="mini-order" key={order.id}>
              <div className="mini-order-top"><span className="order-id">{order.id}</span><StatusBadge tone={order.tone}>{order.status}</StatusBadge></div>
              <strong>{order.product}</strong><span>{order.quantity} <span className="order-dot">·</span> Due {order.date}</span>
              <ProgressBar value={order.progress} label="Production progress" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function FactoryOverview({
  onNavigate,
  onViewOpportunity,
  onQuoteOpportunity,
  firstName,
  requests,
  requestFeedError,
}: {
  onNavigate: (label: string) => void;
  onViewOpportunity: (request: FactoryOpportunity) => void;
  onQuoteOpportunity: (request: FactoryOpportunity) => void;
  firstName: string;
  requests: FactoryOpportunity[];
  requestFeedError: string;
}) {
  const opportunities = [...requests, ...buyerRequests].slice(0, 3);
  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="workspace-eyebrow">WEDNESDAY, NOVEMBER 11, 2026</span>
          <h1>Good morning, {firstName} <span>✦</span></h1>
          <p>Your factory is looking good. Here&apos;s your business snapshot.</p>
        </div>
        <button className="workspace-primary-button" onClick={() => onNavigate("Available Capacity")}><Gauge size={16} /> Update capacity</button>
      </div>
      <div className="workspace-stats">{factoryStats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</div>
      <div className="workspace-two-col factory-overview-top">
        <section className="workspace-panel capacity-panel">
          <SectionHeading title="Production capacity" action="Manage capacity" onAction={() => onNavigate("Available Capacity")} />
          <div className="capacity-summary">
            <div><strong>120,000</strong><span>pcs total monthly capacity</span></div>
            <div className="capacity-legend"><span><i className="legend-booked" />Booked <b>82,000</b></span><span><i className="legend-available" />Available <b>38,000</b></span></div>
          </div>
          <div className="capacity-bar"><span style={{ width: "68%" }} /></div>
          <div className="capacity-bar-labels"><span>68% capacity booked</span><span>32% available</span></div>
          <div className="capacity-chart" aria-label="Monthly capacity overview chart">
            {[46, 61, 55, 74, 62, 82, 68, 91, 73, 84, 66, 78].map((height, index) => (
              <div className="capacity-column" key={`${height}-${index}`}><span className="capacity-booked" style={{ height: `${height}%` }} /><span className="capacity-free" style={{ height: `${100 - height}%` }} /></div>
            ))}
          </div>
          <div className="capacity-months"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span></div>
        </section>
        <section className="workspace-panel opportunity-panel">
          <SectionHeading eyebrow="AI OPPORTUNITY MATCHING" title="Made for your capabilities" action="See all" onAction={() => onNavigate("Production Requests")} />
          <p className="panel-helper">Buyer requests matched to your production profile.</p>
          {opportunities.slice(0, 2).map((request) => (
            <article className="opportunity-item" key={request.id}>
              <div className="opportunity-top"><span className="match-chip">{typeof request.match === "number" ? <><Sparkles size={12} /> {request.match}% match</> : "New request"}</span><span className="request-time"><Clock3 size={12} /> {request.createdAt ? "Recently posted" : "2h ago"}</span></div>
              <strong>{request.product}</strong>
              <span>{request.buyer} <i>·</i> {request.quantity}</span>
              <div className="opportunity-bottom"><span><CalendarDays size={13} /> Due {request.deadline}</span><button onClick={() => onViewOpportunity(request)}>View request <ArrowRight size={13} /></button></div>
            </article>
          ))}
        </section>
      </div>
      <section className="workspace-panel">
        <SectionHeading title="New buyer requests" description="Recent opportunities looking for a manufacturing partner." action="View all requests" onAction={() => onNavigate("Production Requests")} />
        {requestFeedError && <div className="request-storage-notice" role="status">{requestFeedError}</div>}
        <BuyerRequestTable rows={opportunities} onView={onViewOpportunity} onQuote={onQuoteOpportunity} />
      </section>
    </>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return <div className="progress-wrap"><div className="progress-track"><span style={{ width: `${value}%` }} /></div><div className="progress-info"><span>{label}</span><b>{value}%</b></div></div>;
}

function BuyerRequestTable({
  rows,
  onView,
  onQuote,
}: {
  rows: FactoryOpportunity[];
  onView: (request: FactoryOpportunity) => void;
  onQuote: (request: FactoryOpportunity) => void;
}) {
  return (
    <DataTable headers={["Request", "Buyer", "Quantity", "Deadline", "AI match", ""]}>
      {rows.map((request) => (
        <tr key={request.id}>
          <td><strong className="table-main">{request.product}</strong><span className="table-sub">{request.id}</span></td>
          <td>{request.buyer}</td><td>{request.quantity}</td><td>{request.deadline}</td>
          <td><span className="match-text">{typeof request.match === "number" ? <><Sparkles size={13} /> {request.match}%</> : "New"}</span></td>
          <td className="table-actions-cell"><ActionButton onClick={() => onView(request)}>Details</ActionButton><ActionButton variant="primary" onClick={() => onQuote(request)}>Quote</ActionButton></td>
        </tr>
      ))}
    </DataTable>
  );
}

function Marketplace({
  factories,
  factoriesLoading,
  factoryDirectoryError,
  saved,
  onToggleSave,
  onViewFactory,
}: {
  factories: FactoryCard[];
  factoriesLoading: boolean;
  factoryDirectoryError: string;
  saved: string[];
  onToggleSave: (name: string) => void;
  onViewFactory: (factory: FactoryCard) => void;
}) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Any location");
  const [category, setCategory] = useState("All categories");
  const [process, setProcess] = useState("All processes");
  const [capacity, setCapacity] = useState("Any capacity");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("Name");
  const locations = [...new Set(factories.map((factory) => factory.country).filter(Boolean))].sort();
  const categories = [...new Set(factories.flatMap((factory) => factory.products))].sort();
  const filtered = factories.filter((factory) => {
    const text = `${factory.name} ${factory.city} ${factory.country} ${factory.processes.join(" ")} ${factory.products.join(" ")}`.toLowerCase();
    const processMatches = process === "All processes" || factory.processes.some((value) => value.toLowerCase().includes(process.toLowerCase()));
    const capacityValue = factory.monthlyCapacity ?? -1;
    return text.includes(search.toLowerCase()) &&
      (location === "Any location" || factory.country === location) &&
      (category === "All categories" || factory.products.includes(category)) &&
      processMatches &&
      (capacity === "Any capacity" ||
        (capacity === "Under 30k" && capacityValue < 30000) ||
        (capacity === "30k–40k" && capacityValue >= 30000 && capacityValue <= 40000) ||
        (capacity === "40k+" && capacityValue > 40000)) &&
      (!verifiedOnly || factory.verified);
  }).sort((a, b) => sort === "Capacity"
    ? (b.monthlyCapacity ?? -1) - (a.monthlyCapacity ?? -1)
    : a.name.localeCompare(b.name));
  return (
    <>
      <SectionHeading eyebrow="DISCOVER YOUR NEXT PARTNER" title="Find a factory" description="Explore registered manufacturing profiles and compare their stated capabilities." />
      <div className="market-search-panel">
        <label className="market-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search factory, capability or location..." /></label>
        <label className="market-select"><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>Any location</option>{locations.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
        <label className="market-select"><span>Product category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
        <label className="market-select"><span>Process</span><select value={process} onChange={(event) => setProcess(event.target.value)}><option>All processes</option>{processOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></label>
        <label className="market-select"><span>Available capacity</span><select value={capacity} onChange={(event) => setCapacity(event.target.value)}><option>Any capacity</option><option>Under 30k</option><option>30k–40k</option><option>40k+</option></select><ChevronDown size={14} /></label>
        <button className={`verification-filter ${verifiedOnly ? "filter-selected" : ""}`} onClick={() => setVerifiedOnly((current) => !current)}><BadgeCheck size={15} /> Verified only</button>
      </div>
      {factoryDirectoryError && <p className="factory-directory-notice" role="status">{factoryDirectoryError}</p>}
      <div className="market-results-line"><span><strong>{filtered.length} factories</strong> match your search</span><label><SlidersHorizontal size={14} /><span>Sort:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Name</option><option>Capacity</option></select><ChevronDown size={13} /></label></div>
      {filtered.length > 0 ? (
        <div className="marketplace-grid">
          {filtered.map((factory) => <FactoryCardView key={factory.id} factory={factory} saved={saved.includes(factory.id)} onSave={() => onToggleSave(factory.id)} onContact={() => onViewFactory(factory)} />)}
        </div>
      ) : factoriesLoading ? <p className="factory-directory-notice" role="status">Loading registered factory profiles...</p>
        : factories.length === 0 ? <EmptyState title="No registered factories yet" description="Factory profiles will appear here after manufacturers register and share their details." action="Refresh directory" onAction={() => window.location.reload()} />
          : <EmptyState title="No factories found" description="Try adjusting your search or filters to discover more partners." action="Clear filters" onAction={() => { setSearch(""); setLocation("Any location"); setCategory("All categories"); setProcess("All processes"); setCapacity("Any capacity"); setVerifiedOnly(false); }} />}
    </>
  );
}

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ReferenceFilePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove?: () => void;
}) {
  const previewRef = useRef<HTMLAnchorElement>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const preview = previewRef.current;
    if (preview) {
      preview.href = url;
      if (isImage) preview.style.backgroundImage = `url("${url}")`;
    }
    return () => {
      URL.revokeObjectURL(url);
      if (preview) {
        preview.removeAttribute("href");
        preview.style.backgroundImage = "";
      }
    };
  }, [file, isImage]);

  return (
    <div className="request-file-item">
      <a
        ref={previewRef}
        className={`request-file-preview${isImage ? " request-file-image" : ""}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open reference file ${file.name}`}
      >
        {!isImage && <FileText size={20} />}
      </a>
      <span className="request-file-info"><b title={file.name}>{file.name}</b><small>{formatFileSize(file.size)}</small></span>
      {onRemove && <button type="button" className="request-file-remove" aria-label={`Remove ${file.name}`} onClick={onRemove}><X size={14} /></button>}
    </div>
  );
}

function PostRequest({ onSubmitted }: { onSubmitted: (request: BuyerRequestRow) => Promise<RequestSubmissionResult> }) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [submissionResult, setSubmissionResult] = useState<RequestSubmissionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");

  function toggleProcess(process: string) {
    setSelectedProcesses((current) => current.includes(process)
      ? current.filter((item) => item !== process)
      : [...current, process]);
    setSubmissionResult(null);
    setSubmitError("");
  }

  function addFiles(incomingFiles: FileList | File[]) {
    const accepted: File[] = [];
    let rejected = false;
    for (const file of Array.from(incomingFiles)) {
      const validType = file.type.startsWith("image/") ||
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!validType || file.size > 10 * 1024 * 1024) {
        rejected = true;
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length) {
      setFiles((current) => [...current, ...accepted]);
      setSubmissionResult(null);
    }
    setFileError(rejected ? "Some files were not added. Use an image or PDF no larger than 10 MB per file." : "");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const value = (name: string) => String(values.get(name) ?? "").trim();
    const deliveryDate = value("deliveryDate");
    const parsedDate = new Date(`${deliveryDate}T00:00:00`);
    const deadline = Number.isNaN(parsedDate.getTime())
      ? deliveryDate
      : parsedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

    const request: BuyerRequestRow = {
      id: `RFQ-${Date.now()}`,
      product: value("productName"),
      quantity: `${Number(value("quantity")).toLocaleString()} pcs`,
      deadline,
      status: "Matching",
      tone: "amber",
      createdAt: new Date().toISOString(),
      category: value("category"),
      fabric: value("fabric"),
      process: selectedProcesses,
      budget: value("budget"),
      quality: value("quality"),
      instructions: value("instructions"),
      referenceFiles: files,
    };

    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await onSubmitted(request);
      form.reset();
      setFiles([]);
      setSelectedProcesses([]);
      setSubmissionResult(result);
    } catch (error) {
      console.error("[Buyer request] Failed to save production request:", error);
      setSubmitError(error instanceof Error ? error.message : "The request could not be saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SectionHeading eyebrow="START A NEW PROJECT" title="Post a production request" description="Share your requirements and let the right factories come to you." />
      <form className="request-form workspace-panel" onSubmit={submit} onChange={() => { setSubmissionResult(null); setSubmitError(""); }}>
        <div className="request-form-section"><span className="form-step-number">01</span><div><h3>Product details</h3><p>Tell us what you&apos;re looking to make.</p></div></div>
        <div className="request-form-grid">
          <label className="workspace-field"><span>Product name *</span><input name="productName" required placeholder="e.g. Organic cotton crewneck tee" /></label>
          <label className="workspace-field"><span>Product category *</span><select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{productOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="workspace-field"><span>Required quantity *</span><input name="quantity" required type="number" min="1" placeholder="e.g. 5,000" /></label>
          <label className="workspace-field"><span>Fabric type</span><select name="fabric" defaultValue=""><option value="">Select a fabric</option><option>Organic cotton jersey</option><option>French terry</option><option>Recycled polyester</option><option>Linen blend</option><option>Denim</option><option>Other</option></select></label>
          <div className="workspace-field">
            <span>Manufacturing processes (select all that apply)</span>
            <div className="selectable-chips" role="group" aria-label="Manufacturing processes">
              {processOptions.map((option) => (
                <button
                  type="button"
                  className={selectedProcesses.includes(option) ? "chip-selected" : ""}
                  aria-pressed={selectedProcesses.includes(option)}
                  key={option}
                  onClick={() => toggleProcess(option)}
                >
                  {selectedProcesses.includes(option) && <Check size={13} />}
                  {option}
                </button>
              ))}
            </div>
          </div>
          <label className="workspace-field"><span>Required delivery date *</span><input name="deliveryDate" type="date" required /></label>
          <label className="workspace-field"><span>Target budget (per unit)</span><div className="input-prefix"><span>$</span><input name="budget" type="number" min="0" step="0.01" placeholder="0.00" /></div></label>
          <label className="workspace-field"><span>Quality requirements</span><select name="quality" defaultValue=""><option value="">Select a standard</option><option>Standard quality</option><option>Premium quality</option><option>GOTS certified</option><option>OEKO-TEX certified</option></select></label>
          <label className="workspace-field field-full"><span>Additional instructions</span><textarea name="instructions" rows={4} placeholder="Share sizing, packaging or other production details..." /></label>
          <div className="workspace-field field-full upload-field">
            <span>Reference images</span>
            <span
              className="upload-drop"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}
            >
              <Upload size={19} /><b>Click to upload</b> or drag and drop
              <small>Images or PDF up to 10 MB each</small>
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                multiple
                aria-label="Upload reference images"
                onChange={(event) => {
                  if (event.currentTarget.files) addFiles(event.currentTarget.files);
                  event.currentTarget.value = "";
                }}
              />
            </span>
            {fileError && <span className="request-form-error" role="alert">{fileError}</span>}
            {files.length > 0 && <div className="request-file-list">{files.map((file, index) => <ReferenceFilePreview key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} />)}</div>}
          </div>
        </div>
        {submissionResult && <div className={submissionResult.shared ? "inline-success" : "request-storage-notice"} role="status"><ShieldCheck size={16} /> {submissionResult.message}</div>}
        {submitError && <div className="request-form-error" role="alert">{submitError}</div>}
        <div className="request-form-footer"><span><ShieldCheck size={15} /> Requests and attachments are stored in this browser.</span><button type="submit" className="workspace-primary-button" disabled={submitting}>{submitting ? "Saving request..." : <>Save production request <ArrowRight size={15} /></>}</button></div>
      </form>
    </>
  );
}

function BuyerRequestsPage({
  requests,
  storageError,
  onNewRequest,
}: {
  requests: BuyerRequestRow[];
  storageError: string;
  onNewRequest: () => void;
}) {
  const [filter, setFilter] = useState("All requests");
  const rows = filter === "All requests" ? requests : requests.filter((request) => request.status === filter);
  const [selectedRequest, setSelectedRequest] = useState<BuyerRequestRow | null>(null);
  return (
    <>
      <SectionHeading eyebrow="YOUR PRODUCTION PIPELINE" title="My requests" description="Track open production briefs and compare factory responses." action="New request" onAction={onNewRequest} />
      <div className="request-storage-notice"><ShieldCheck size={15} /> Production requests sync online with connected factories and keep a local backup in this browser.</div>
      {storageError && <div className="request-form-error" role="alert">{storageError}</div>}
      <div className="workspace-panel">
        <div className="table-toolbar"><div className="table-tabs">{["All requests", "Matching", "Quotations received", "Order requested", "Order confirmed", "In review"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="toolbar-filter"><Filter size={14} /> Filter</button></div>
        {rows.length ? (
          <DataTable headers={["Request", "Quantity", "Deadline", "Responses", "Status", ""]}>
            {rows.map((row) => <tr key={row.id}><td><strong className="table-main">{row.product}</strong><span className="table-sub">{row.id}</span></td><td>{row.quantity}</td><td>{row.deadline}</td><td>{row.responseCount ?? 0} factories</td><td><StatusBadge tone={row.tone}>{row.status}</StatusBadge></td><td><ActionButton onClick={() => setSelectedRequest(row)}>Details</ActionButton></td></tr>)}
          </DataTable>
        ) : <div className="request-empty-state"><ClipboardList size={20} /><b>No requests in this category.</b></div>}
      </div>
      {selectedRequest && (
        <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedRequest(null); }}>
          <section className="workspace-modal request-details-modal" role="dialog" aria-modal="true" aria-labelledby="request-details-title">
            <button className="modal-close" aria-label="Close request details" onClick={() => setSelectedRequest(null)}><X size={17} /></button>
            <span className="modal-icon"><ClipboardList size={21} /></span>
            <h2 id="request-details-title">{selectedRequest.product}</h2>
            <p>{selectedRequest.id} · {selectedRequest.status}</p>
            <div className="request-detail-grid">
              <span><small>Category</small><b>{selectedRequest.category || "Not specified"}</b></span>
              <span><small>Quantity</small><b>{selectedRequest.quantity}</b></span>
              <span><small>Fabric</small><b>{selectedRequest.fabric || "Not specified"}</b></span>
              <span><small>Processes</small><b>{Array.isArray(selectedRequest.process) ? selectedRequest.process.join(", ") || "Not specified" : selectedRequest.process || "Not specified"}</b></span>
              <span><small>Delivery date</small><b>{selectedRequest.deadline}</b></span>
              <span><small>Budget / unit</small><b>{selectedRequest.budget ? `$${selectedRequest.budget}` : "Not specified"}</b></span>
              <span><small>Quality</small><b>{selectedRequest.quality || "Not specified"}</b></span>
            </div>
            <div className="request-detail-instructions"><b>Additional instructions</b><p>{selectedRequest.instructions || "No additional instructions provided."}</p></div>
            <div className="request-detail-files">
              <b>Reference files ({selectedRequest.referenceFiles?.length ?? 0})</b>
              {selectedRequest.referenceFiles?.length
                ? <div className="request-file-list">{selectedRequest.referenceFiles.map((file, index) => <ReferenceFilePreview key={`${file.name}-${file.lastModified}-${index}`} file={file} />)}</div>
                : <p>No reference files were attached to this request.</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function BuyerQuotations({
  onContact,
  onNavigate,
  onRequestOrder,
  orders,
  quotes: storedQuotes,
  quoteFeedError,
}: {
  onContact: (title: string) => void;
  onNavigate: (label: string) => void;
  onRequestOrder: (quote: StoredQuote) => Promise<RequestSubmissionResult>;
  orders: DashboardOrder[];
  quotes: StoredQuote[];
  quoteFeedError: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<StoredQuote | null>(null);
  const [filter, setFilter] = useState("All quotes");
  const [comparisonQuotes, setComparisonQuotes] = useState<BuyerQuoteView[] | null>(null);
  const [orderQuote, setOrderQuote] = useState<StoredQuote | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderOutcome, setOrderOutcome] = useState("");
  const allQuotes = [...storedQuotes.map((quote) => toBuyerQuoteView(quote, orders)), ...quotationRows];
  const quotes = filter === "All quotes"
    ? allQuotes
    : filter === "New"
      ? allQuotes.filter((quote) => quote.status === "New quote")
      : allQuotes.filter((quote) => quote.status === filter);
  const selectedRows = allQuotes.filter((quote) => selected.includes(quote.id));
  const selectedRequestId = selectedRows.find((quote) => quote.quote)?.quote?.requestId;
  const canCompare = selectedRows.length >= 2 &&
    selectedRows.every((quote) => quote.quote && quote.quote.requestId === selectedRequestId);
  const beginOrderRequest = (quote: StoredQuote) => {
    setSelectedQuote(null);
    setComparisonQuotes(null);
    setOrderError("");
    setOrderQuote(quote);
  };
  const existingOrderForQuote = (quoteId: string) =>
    orders.find((order) => order.quoteId === quoteId && order.status !== "CANCELLED");
  const submitOrderRequest = async () => {
    if (!orderQuote || orderSaving) return;
    setOrderSaving(true);
    setOrderError("");
    try {
      const result = await onRequestOrder(orderQuote);
      setOrderQuote(null);
      setOrderOutcome(result.message);
    } catch (error) {
      console.error("[Orders] Failed to send order request:", error);
      setOrderError(error instanceof Error ? error.message : "The order request could not be saved.");
    } finally {
      setOrderSaving(false);
    }
  };
  return (
    <>
      <SectionHeading eyebrow="COMPARE YOUR OPTIONS" title="Received quotations" description="Review pricing, timelines and terms from your factory partners." />
      {quoteFeedError && <p className="request-storage-notice" role="status">{quoteFeedError}</p>}
      <div className="workspace-panel">
        <div className="table-toolbar"><div className="table-tabs">{["All quotes", "New", "Order requested", "Confirmed", "Shortlisted"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}{item === "All quotes" && <span>{allQuotes.length}</span>}{item === "New" && <span>{allQuotes.filter((quote) => quote.status === "New quote").length}</span>}</button>)}</div><button className="workspace-primary-button compact-button" disabled={!canCompare} onClick={() => setComparisonQuotes(selectedRows)}>Compare selected <ArrowRight size={14} /></button></div>
        {selected.length > 0 && !canCompare && <p className="factory-directory-notice">Select at least two real quotations for the same production request to compare them.</p>}
        <DataTable headers={["", "Factory", "Product", "Quoted price", "Delivery", "Status", ""]}>
          {quotes.map((quote) => <tr key={quote.id}><td><input aria-label={`Select ${quote.factory} quotation`} type="checkbox" disabled={!quote.quote || Boolean(selectedRequestId && quote.quote.requestId !== selectedRequestId)} checked={selected.includes(quote.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, quote.id] : current.filter((id) => id !== quote.id))} /></td><td><strong className="table-main">{quote.factory}</strong><span className="table-sub">{quote.location}{quote.quote && <><br />{quote.quote.factoryEmail}</>}</span></td><td>{quote.product}</td><td><strong>{quote.price}</strong></td><td>{quote.delivery}</td><td><StatusBadge tone={quote.tone}>{quote.status}</StatusBadge></td><td><ActionButton onClick={() => quote.quote ? setSelectedQuote(quote.quote) : onContact(`Quotation from ${quote.factory}`)}>Details</ActionButton></td></tr>)}
        </DataTable>
      </div>
      {selectedQuote && (() => {
        const activeOrder = existingOrderForQuote(selectedQuote.id);
        return (
          <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedQuote(null); }}>
            <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="buyer-quote-title">
              <button className="modal-close" aria-label="Close quotation details" onClick={() => setSelectedQuote(null)}><X size={17} /></button>
              <span className="modal-icon"><FileText size={21} /></span>
              <h2 id="buyer-quote-title">Quotation from {selectedQuote.factoryName}</h2>
              <p>Request {selectedQuote.requestId} · {selectedQuote.createdAt ? new Date(selectedQuote.createdAt).toLocaleString() : "Submission date unavailable"}</p>
              <dl className="factory-profile-modal-details">
                <div><dt>Product</dt><dd>{selectedQuote.product}</dd></div>
                <div><dt>Quantity</dt><dd>{selectedQuote.quantity || "Not provided"}</dd></div>
                <div><dt>Price per unit</dt><dd>{selectedQuote.currency} {selectedQuote.pricePerUnit.toFixed(2)}</dd></div>
                <div><dt>Estimated lead time</dt><dd>{selectedQuote.leadTime}</dd></div>
                <div><dt>Factory location</dt><dd>{selectedQuote.factoryLocation || "Not provided"}</dd></div>
                <div><dt>Additional terms</dt><dd>{selectedQuote.terms || "No additional terms provided."}</dd></div>
              </dl>
              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setSelectedQuote(null)}>Close</button>
                <button className="workspace-primary-button" disabled={Boolean(activeOrder)} onClick={() => beginOrderRequest(selectedQuote)}>{activeOrder?.status === "CONFIRMED" ? "Order confirmed" : activeOrder ? "Order request sent" : "Request order"} <ArrowRight size={14} /></button>
              </div>
            </section>
          </div>
        );
      })()}
      {comparisonQuotes && (
        <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComparisonQuotes(null); }}>
          <section className="workspace-modal request-details-modal" role="dialog" aria-modal="true" aria-labelledby="quote-comparison-title">
            <button className="modal-close" aria-label="Close comparison" onClick={() => setComparisonQuotes(null)}><X size={17} /></button>
            <span className="modal-icon"><SlidersHorizontal size={21} /></span>
            <h2 id="quote-comparison-title">Compare factory quotations</h2>
            <p>These offers are for production request {comparisonQuotes[0]?.quote?.requestId}.</p>
            <DataTable headers={["Factory", "Unit price", "Quantity", "Estimated total", "Lead time", "Terms", ""]}>
              {comparisonQuotes.map((row) => {
                const quote = row.quote;
                if (!quote) return null;
                const quantity = Number(quote.quantity.replace(/[^\d]/g, ""));
                const total = Number.isFinite(quantity) && quantity > 0
                  ? `${quote.currency} ${(quantity * quote.pricePerUnit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "Not available";
                const activeOrder = existingOrderForQuote(quote.id);
                return (
                  <tr key={quote.id}>
                    <td><strong className="table-main">{quote.factoryName}</strong><span className="table-sub">{quote.factoryLocation || "Location not provided"}</span></td>
                    <td>{quote.currency} {quote.pricePerUnit.toFixed(2)}</td>
                    <td>{quote.quantity || "Not provided"}</td>
                    <td>{total}</td>
                    <td>{quote.leadTime}</td>
                    <td>{quote.terms || "No additional terms"}</td>
                    <td><button className="table-action table-action-primary" disabled={Boolean(activeOrder)} onClick={() => beginOrderRequest(quote)}>{activeOrder?.status === "CONFIRMED" ? "Confirmed" : activeOrder ? "Request sent" : "Request order"}</button></td>
                  </tr>
                );
              })}
            </DataTable>
            <div className="modal-actions"><button className="cancel-button" onClick={() => setComparisonQuotes(null)}>Close comparison</button></div>
          </section>
        </div>
      )}
      {orderQuote && (
        <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !orderSaving) setOrderQuote(null); }}>
          <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="order-request-title">
            <button className="modal-close" aria-label="Close order request" onClick={() => !orderSaving && setOrderQuote(null)}><X size={17} /></button>
            <span className="modal-icon"><Package size={21} /></span>
            <h2 id="order-request-title">Send order request?</h2>
            <p>Send this offer to {orderQuote.factoryName} for factory confirmation.</p>
            <dl className="factory-profile-modal-details">
              <div><dt>Product</dt><dd>{orderQuote.product}</dd></div>
              <div><dt>Quantity</dt><dd>{orderQuote.quantity}</dd></div>
              <div><dt>Unit price</dt><dd>{orderQuote.currency} {orderQuote.pricePerUnit.toFixed(2)}</dd></div>
              <div><dt>Estimated total</dt><dd>{orderQuote.currency} {(Number(orderQuote.quantity.replace(/[^\d]/g, "")) * orderQuote.pricePerUnit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd></div>
              <div><dt>Estimated lead time</dt><dd>{orderQuote.leadTime}</dd></div>
            </dl>
            <p className="factory-directory-notice">This is an order request, not a confirmed order. The factory must confirm it. No payment is taken.</p>
            {orderError && <p className="field-error" role="alert">{orderError}</p>}
            <div className="modal-actions">
              <button className="cancel-button" disabled={orderSaving} onClick={() => setOrderQuote(null)}>Cancel</button>
              <button className="workspace-primary-button" disabled={orderSaving} onClick={() => void submitOrderRequest()}>{orderSaving ? "Sending request..." : "Send order request"} <ArrowRight size={14} /></button>
            </div>
          </section>
        </div>
      )}
      {orderOutcome && (
        <div className="workspace-modal-backdrop" role="presentation">
          <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="order-request-sent-title">
            <span className="modal-icon"><CheckCircle2 size={21} /></span>
            <h2 id="order-request-sent-title">Order request sent</h2>
            <p>{orderOutcome}</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setOrderOutcome("")}>Close</button>
              <button className="workspace-primary-button" onClick={() => { setOrderOutcome(""); onNavigate("My Orders"); }}>View My Orders <ArrowRight size={14} /></button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function OrdersPage({
  factory = false,
  onContact,
  orders,
  onConfirmOrder,
  onRetryOrder,
  feedError,
}: {
  factory?: boolean;
  onContact: (title: string) => void;
  orders: DashboardOrder[];
  onConfirmOrder?: (orderId: string) => Promise<void>;
  onRetryOrder?: (orderId: string) => Promise<void>;
  feedError: string;
}) {
  const [filter, setFilter] = useState("All orders");
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState("");
  const [retryingOrderId, setRetryingOrderId] = useState("");
  const [actionError, setActionError] = useState("");
  const liveRows = orders.map((order) => ({
    id: order.id,
    company: factory ? order.buyerName : order.factoryName,
    product: order.product,
    quantity: order.quantity,
    date: order.targetDeliveryDate || "Not specified",
    progress: order.status === "CONFIRMED" ? 25 : 0,
    status: order.status === "PENDING_FACTORY_CONFIRMATION"
      ? "Awaiting factory confirmation"
      : order.status === "CONFIRMED" ? "Confirmed" : "Cancelled",
    tone: order.status === "CONFIRMED" ? "teal" : order.status === "CANCELLED" ? "amber" : "blue",
    order,
  }));
  const demoRows = orderRows.map((row) => ({
    id: row.id,
    company: factory ? row.buyer : ({
      "ORD-2804": "Evergreen Apparel Ltd.",
      "ORD-2798": "Meridian Garments",
      "ORD-2786": "Thread & Loom Works",
      "ORD-2764": "Evergreen Apparel Ltd.",
    }[row.id] || "Factory"),
    product: row.product,
    quantity: row.quantity,
    date: row.date,
    progress: row.progress,
    status: row.status,
    tone: row.tone,
    order: undefined,
  }));
  const allRows = [...liveRows, ...demoRows];
  const rows = allRows.filter((row) => filter === "All orders" ||
    (filter === "Awaiting factory confirmation" && row.status === "Awaiting factory confirmation") ||
    (filter === "Confirmed" && row.status === "Confirmed") ||
    row.status === filter);
  const filterOptions = ["All orders", "Awaiting factory confirmation", "Confirmed", "In production", "Ready to ship", "Completed"];
  const confirmOrder = async (orderId: string) => {
    if (!onConfirmOrder || confirmingOrderId) return;
    setConfirmingOrderId(orderId);
    setActionError("");
    try {
      await onConfirmOrder(orderId);
    } catch (error) {
      console.error("[Orders] Failed to confirm order request:", error);
      setActionError(error instanceof Error ? error.message : "The order request could not be confirmed.");
    } finally {
      setConfirmingOrderId("");
    }
  };
  const retryOrder = async (orderId: string) => {
    if (!onRetryOrder || retryingOrderId) return;
    setRetryingOrderId(orderId);
    setActionError("");
    try {
      await onRetryOrder(orderId);
      setSelectedOrder(null);
    } catch (error) {
      console.error("[Orders] Failed to send the saved order request:", error);
      setActionError(error instanceof Error ? error.message : "The order request could not be sent.");
    } finally {
      setRetryingOrderId("");
    }
  };
  return (
    <>
      <SectionHeading eyebrow="PRODUCTION TRACKING" title={factory ? "Received orders" : "My orders"} description={factory ? "Keep every active production order on schedule." : "Follow your orders from production floor to delivery."} />
      {feedError && <p className="request-storage-notice" role="status">{feedError}</p>}
      {actionError && <p className="field-error" role="alert">{actionError}</p>}
      <div className="workspace-stats compact-stats">
        <article className="workspace-stat-card"><span className="stat-label">Order requests</span><div className="stat-value-line"><strong>{orders.length}</strong></div><span className="stat-card-note">Tracked in this workspace</span></article>
        <article className="workspace-stat-card"><span className="stat-label">Awaiting confirmation</span><div className="stat-value-line"><strong>{orders.filter((order) => order.status === "PENDING_FACTORY_CONFIRMATION").length}</strong></div><span className="stat-card-note">Needs factory response</span></article>
        <article className="workspace-stat-card"><span className="stat-label">Confirmed</span><div className="stat-value-line"><strong>{orders.filter((order) => order.status === "CONFIRMED").length}</strong></div><span className="stat-card-note">Agreed with the factory</span></article>
        <article className="workspace-stat-card"><span className="stat-label">Cancelled</span><div className="stat-value-line"><strong>{orders.filter((order) => order.status === "CANCELLED").length}</strong></div><span className="stat-card-note">No active production</span></article>
      </div>
      {orders.length === 0 && <p className="request-storage-notice" role="status">{factory ? "Order requests from buyers will appear here after they choose one of your quotations." : "After you send an order request, track factory confirmation here."}</p>}
      <div className="workspace-panel"><div className="table-toolbar"><div className="table-tabs">{filterOptions.map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="toolbar-filter"><Filter size={14} /> Filter</button></div>
        <DataTable headers={["Order", factory ? "Buyer" : "Factory", "Product", "Quantity", "Delivery date", "Progress", "Status", ""]}>
          {rows.map((row) => <tr key={row.id}><td><strong className="table-main">{row.id}</strong>{row.order && <span className="table-sub">{row.order.requestId}</span>}</td><td>{row.company}</td><td>{row.product}</td><td>{row.quantity}</td><td>{row.date}</td><td><div className="table-progress"><div><span style={{ width: `${row.progress}%` }} /></div>{row.progress}%</div></td><td><StatusBadge tone={row.tone}>{row.status}</StatusBadge></td><td>{row.order && factory && row.order.status === "PENDING_FACTORY_CONFIRMATION" ? <ActionButton variant="primary" onClick={() => { if (row.order) void confirmOrder(row.order.id); }}>{confirmingOrderId === row.order?.id ? "Confirming..." : "Confirm order"}</ActionButton> : <ActionButton onClick={() => row.order ? setSelectedOrder(row.order) : onContact(row.id)}>Details</ActionButton>}</td></tr>)}
        </DataTable>
      </div>
      {selectedOrder && (
        <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrder(null); }}>
          <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="order-details-title">
            <button className="modal-close" aria-label="Close order details" onClick={() => setSelectedOrder(null)}><X size={17} /></button>
            <span className="modal-icon"><Package size={21} /></span>
            <h2 id="order-details-title">Order request {selectedOrder.id}</h2>
            <p>{selectedOrder.product} · Request {selectedOrder.requestId}</p>
            <dl className="factory-profile-modal-details">
              <div><dt>{factory ? "Buyer" : "Factory"}</dt><dd>{factory ? selectedOrder.buyerName : selectedOrder.factoryName}</dd></div>
              <div><dt>Quantity</dt><dd>{selectedOrder.quantity}</dd></div>
              <div><dt>Price per unit</dt><dd>{selectedOrder.currency} {selectedOrder.pricePerUnit.toFixed(2)}</dd></div>
              <div><dt>Estimated total</dt><dd>{selectedOrder.currency} {(Number(selectedOrder.quantity.replace(/[^\d]/g, "")) * selectedOrder.pricePerUnit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd></div>
              <div><dt>Delivery date</dt><dd>{selectedOrder.targetDeliveryDate || "Not specified"}</dd></div>
              <div><dt>Status</dt><dd>{selectedOrder.status === "PENDING_FACTORY_CONFIRMATION" ? "Awaiting factory confirmation" : selectedOrder.status}</dd></div>
              <div><dt>Terms</dt><dd>{selectedOrder.terms || "No additional terms"}</dd></div>
            </dl>
            <div className="modal-actions">
              {!factory && !selectedOrder.isOnline && onRetryOrder && selectedOrder.status === "PENDING_FACTORY_CONFIRMATION" && (
                <button className="cancel-button" disabled={retryingOrderId === selectedOrder.id} onClick={() => void retryOrder(selectedOrder.id)}>
                  {retryingOrderId === selectedOrder.id ? "Syncing..." : "Sync online"}
                </button>
              )}
              <button className="workspace-primary-button" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function FactoryRequests({
  onViewOpportunity,
  onQuoteOpportunity,
  requests,
  requestFeedError,
}: {
  onViewOpportunity: (request: FactoryOpportunity) => void;
  onQuoteOpportunity: (request: FactoryOpportunity) => void;
  requests: FactoryOpportunity[];
  requestFeedError: string;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All opportunities");
  const matchesFilter = (row: FactoryOpportunity) =>
    `${row.product} ${row.buyer} ${row.id}`.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All opportunities" ||
      (filter === "AI matched" && typeof row.match === "number" && row.match >= 94) ||
      (filter === "Saved" && typeof row.match === "number" && row.match >= 98));
  const rows = [...requests, ...buyerRequests].filter((row) =>
    matchesFilter(row),
  );
  return (
    <>
      <SectionHeading eyebrow="FIND YOUR NEXT ORDER" title="Production requests" description="Buyer requests matched to your factory profile and available capacity." />
      {requestFeedError && <div className="request-storage-notice" role="status">{requestFeedError}</div>}
      <div className="workspace-panel">
        <div className="table-toolbar"><label className="table-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." /></label><div className="table-tabs">{["All opportunities", "AI matched", "Saved"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="toolbar-filter"><Filter size={14} /> Filter</button></div>
        <BuyerRequestTable
          rows={rows}
          onView={onViewOpportunity}
          onQuote={onQuoteOpportunity}
        />
      </div>
    </>
  );
}

function FactoryQuotations({
  onContact,
  quotes: storedQuotes,
  orders,
  quoteFeedError,
}: {
  onContact: (title: string) => void;
  quotes: StoredQuote[];
  orders: DashboardOrder[];
  quoteFeedError: string;
}) {
  const [filter, setFilter] = useState("All quotations");
  const allQuotes = [
    ...storedQuotes.map((quote) => {
      const matchingOrder = orders.find((order) => order.quoteId === quote.id && order.status !== "CANCELLED");
      const status = matchingOrder?.status === "CONFIRMED"
        ? "Confirmed"
        : matchingOrder?.status === "PENDING_FACTORY_CONFIRMATION"
          ? "Order requested"
          : "Awaiting response";
      const tone = matchingOrder?.status === "CONFIRMED"
        ? "teal"
        : matchingOrder?.status === "PENDING_FACTORY_CONFIRMATION"
          ? "blue"
          : "amber";
      return {
        id: quote.id,
        buyer: quote.buyerName || quote.buyerEmail || "Buyer",
        product: quote.product,
        price: `${quote.currency} ${quote.pricePerUnit.toFixed(2)} / unit`,
        delivery: quote.leadTime,
        status,
        tone,
        requestId: quote.requestId,
        createdAt: quote.createdAt,
      };
    }),
    ...quotationsFactory.map((quote, index) => ({ ...quote, id: `demo-${index}`, requestId: "", createdAt: "" })),
  ];
  const quotes = filter === "All quotations" ? allQuotes : allQuotes.filter((quote) => quote.status === filter);
  return (
    <>
      <SectionHeading eyebrow="YOUR ACTIVE OFFERS" title="My quotations" description="Track the quotes you have shared with prospective buyers." />
      {quoteFeedError && <p className="request-storage-notice" role="status">{quoteFeedError}</p>}
      <div className="workspace-panel">
        <div className="table-toolbar"><div className="table-tabs">{["All quotations", "Awaiting response", "Order requested", "Confirmed", "Shortlisted", "Negotiating"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="toolbar-filter"><Filter size={14} /> Filter</button></div>
        <DataTable headers={["Buyer", "Product", "Quoted price", "Delivery time", "Sent", "Status", ""]}>
          {quotes.map((quote) => <tr key={quote.id}><td><strong className="table-main">{quote.buyer}</strong><span className="table-sub">{quote.requestId ? quote.requestId : "Demo quotation"}</span></td><td>{quote.product}</td><td><strong>{quote.price}</strong></td><td>{quote.delivery}</td><td>{quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Demo"}</td><td><StatusBadge tone={quote.tone}>{quote.status}</StatusBadge></td><td><ActionButton onClick={() => onContact(quote.requestId ? `Quotation for ${quote.requestId}` : quote.buyer)}>Details</ActionButton></td></tr>)}
        </DataTable>
      </div>
    </>
  );
}

function CapacityManagement({ onContact }: { onContact: (title: string) => void }) {
  const [capacity, setCapacity] = useState(120000);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("120000");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(11);
  const booked = 82000;
  const available = capacity - booked;
  const calendarMonth = new Date(2026, 10 + monthOffset, 1);
  const monthLabel = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const previousMonthDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
  const startOffset = (calendarMonth.getDay() + 6) % 7;
  return (
    <>
      <SectionHeading eyebrow="PLAN YOUR PRODUCTION" title="Available capacity" description="Keep your production availability current so buyers can find the right fit." action={editing ? undefined : "Update capacity"} onAction={() => { setEditing(true); setInput(String(capacity)); }} />
      <div className="capacity-kpi-grid">
        <article className="capacity-kpi"><span>Total monthly capacity</span><strong>{capacity.toLocaleString()} <small>pcs</small></strong><div><Factory size={14} /> Across all production lines</div></article>
        <article className="capacity-kpi"><span>Already booked</span><strong>{booked.toLocaleString()} <small>pcs</small></strong><div><Package size={14} /> Confirmed production orders</div></article>
        <article className="capacity-kpi capacity-kpi-teal"><span>Available capacity</span><strong>{Math.max(available, 0).toLocaleString()} <small>pcs</small></strong><div><CheckCircle2 size={14} /> Open for new opportunities</div></article>
      </div>
      {editing && <div className="capacity-edit workspace-panel"><label className="workspace-field"><span>Monthly capacity (pieces)</span><input type="number" min={booked} value={input} onChange={(event) => setInput(event.target.value)} /></label><button className="workspace-primary-button" onClick={() => { setCapacity(Math.max(booked, Number(input) || booked)); setEditing(false); onContact("Capacity updated"); }}>Save capacity <Check size={15} /></button><button className="cancel-button" onClick={() => setEditing(false)}>Cancel</button></div>}
      <div className="workspace-two-col capacity-detail-grid">
        <section className="workspace-panel">
          <SectionHeading title="Product-wise capacity" description="Capacity allocated to each product category." />
          {[
            { name: "Knit tops & tees", booked: 74, total: "60,000 pcs", color: "mint" },
            { name: "Polo shirts", booked: 62, total: "25,000 pcs", color: "blue" },
            { name: "Sweatshirts & hoodies", booked: 55, total: "20,000 pcs", color: "violet" },
            { name: "Custom orders", booked: 81, total: "15,000 pcs", color: "amber" },
          ].map((line) => <div className="capacity-line" key={line.name}><div><strong>{line.name}</strong><span>{line.total}</span></div><ProgressBar value={line.booked} label={`${line.booked}% booked`} /></div>)}
        </section>
        <section className="workspace-panel">
          <SectionHeading title="Production availability" action="View calendar" onAction={() => onContact("Production availability calendar")} />
          <div className="calendar-head"><button aria-label="Previous month" onClick={() => { setMonthOffset((current) => current - 1); setSelectedDate(0); }}><ChevronLeft size={17} /></button><strong>{monthLabel}</strong><button aria-label="Next month" onClick={() => { setMonthOffset((current) => current + 1); setSelectedDate(0); }}><ChevronRight size={17} /></button></div>
          <div className="capacity-calendar">
            {["M","T","W","T","F","S","S"].map((day, index) => <span className="calendar-day-label" key={`${day}-${index}`}>{day}</span>)}
            {Array.from({ length: 42 }, (_, index) => {
              const date = index - startOffset + 1;
              const actual = date > 0 && date <= daysInMonth;
              const displayDate = date <= 0 ? previousMonthDays + date : date > daysInMonth ? date - daysInMonth : date;
              const level = actual && (date % 7 === 0 || date % 9 === 0) ? "calendar-busy" : actual && date % 5 === 0 ? "calendar-mid" : "";
              return <button className={`calendar-date ${actual ? "" : "calendar-outside"} ${level} ${monthOffset === 0 && date === selectedDate && actual ? "calendar-today" : ""}`} key={index} onClick={() => actual && setSelectedDate(date)}>{displayDate}</button>;
            })}
          </div>
          <div className="calendar-legend"><span><i className="legend-open" />Available</span><span><i className="legend-mid" />Limited</span><span><i className="legend-full" />At capacity</span></div>
        </section>
      </div>
    </>
  );
}

function FactoryProfile({
  profile,
  onSave,
}: {
  profile: FactoryProfileDetails;
  onSave: (profile: FactoryProfileDetails) => Promise<string>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  function updateField<K extends keyof FactoryProfileDetails>(field: K, value: FactoryProfileDetails[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveMessage("");
  }

  function toggleSelection(field: "processes" | "products", value: string) {
    updateField(
      field,
      draft[field].includes(value)
        ? draft[field].filter((item) => item !== value)
        : [...draft[field], value],
    );
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveError("");
    try {
      const message = await onSave(draft);
      setSaveMessage(message);
      setEditing(false);
    } catch (error) {
      console.error("[Factory profile] Failed to save profile:", error);
      setSaveError(error instanceof Error ? error.message : "The factory profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const location = [profile.city, profile.country].filter(Boolean).join(", ") || "Location not provided";
  const capacity = profile.monthlyCapacity > 0
    ? `${profile.monthlyCapacity.toLocaleString()} pcs`
    : "Not provided";
  const companyInitials = profile.companyName.trim().slice(0, 2).toUpperCase() || "FC";
  const websiteUrl = profile.website && /^https?:\/\//i.test(profile.website)
    ? profile.website
    : profile.website ? `https://${profile.website}` : "";

  return (
    <>
      <SectionHeading
        eyebrow="YOUR BUSINESS PRESENCE"
        title="Factory profile"
        description="Review and update the company and production details you provided during registration."
        action={editing ? undefined : "Edit profile"}
        onAction={() => { setDraft(profile); setSaveError(""); setEditing(true); }}
      />
      {saveMessage && <div className="profile-save-message" role="status"><CheckCircle2 size={16} />{saveMessage}</div>}
      {editing ? (
        <form className="workspace-panel factory-profile-editor" onSubmit={submitProfile}>
          <div className="request-form-section"><span className="form-step-number">01</span><div><h3>Factory and contact details</h3><p>Keep your registration information accurate for buyer discovery.</p></div></div>
          <div className="request-form-grid">
            <label className="workspace-field"><span>Owner / representative name *</span><input required value={draft.fullName} onChange={(event) => updateField("fullName", event.target.value)} /></label>
            <label className="workspace-field"><span>Company / factory name *</span><input required value={draft.companyName} onChange={(event) => updateField("companyName", event.target.value)} /></label>
            <label className="workspace-field"><span>Business email</span><input type="email" value={draft.email} readOnly /></label>
            <label className="workspace-field"><span>Contact phone</span><input type="tel" value={draft.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
            <label className="workspace-field"><span>Country *</span><input required value={draft.country} onChange={(event) => updateField("country", event.target.value)} /></label>
            <label className="workspace-field"><span>City / industrial zone</span><input value={draft.city} onChange={(event) => updateField("city", event.target.value)} /></label>
            <label className="workspace-field"><span>Factory website</span><input type="url" value={draft.website} onChange={(event) => updateField("website", event.target.value)} placeholder="https://example.com" /></label>
            <label className="workspace-field"><span>Monthly production capacity (pcs)</span><input type="number" min="0" value={draft.monthlyCapacity || ""} onChange={(event) => updateField("monthlyCapacity", Number(event.target.value) || 0)} /></label>
            <label className="workspace-field"><span>Minimum order quantity (pcs)</span><input type="number" min="0" value={draft.moq || ""} onChange={(event) => updateField("moq", Number(event.target.value) || 0)} /></label>
          </div>
          <div className="factory-profile-editor-group">
            <h4 className="profile-subhead">Production processes</h4>
            <div className="selectable-chips">
              {processOptions.map((process) => <button type="button" className={draft.processes.includes(process) ? "chip-selected" : ""} key={process} onClick={() => toggleSelection("processes", process)}>{draft.processes.includes(process) && <Check size={13} />}{process}</button>)}
            </div>
          </div>
          <div className="factory-profile-editor-group">
            <h4 className="profile-subhead">Product categories</h4>
            <div className="selectable-chips">
              {factoryProductOptions.map((product) => <button type="button" className={draft.products.includes(product) ? "chip-selected" : ""} key={product} onClick={() => toggleSelection("products", product)}>{draft.products.includes(product) && <Check size={13} />}{product}</button>)}
            </div>
          </div>
          {saveError && <div className="profile-edit-error" role="alert">{saveError}</div>}
          <div className="request-form-footer">
            <span><ShieldCheck size={15} /> Changes update your factory profile and registration details.</span>
            <div className="factory-profile-form-actions">
              <button type="button" className="cancel-button" onClick={() => { setDraft(profile); setSaveError(""); setEditing(false); }}>Cancel</button>
              <button type="submit" className="workspace-primary-button" disabled={saving}>{saving ? "Saving profile..." : <>Save profile <Check size={15} /></>}</button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <section className="workspace-panel profile-banner">
            <div className="profile-cover" />
            <div className="profile-main-info">
              <div className="factory-logo">{companyInitials}</div>
              <div className="profile-title">
                <div><h2>{profile.companyName || "Factory name not provided"}</h2><p><span>⌖</span> {location}</p></div>
                <StatusBadge tone="amber">Not yet verified</StatusBadge>
              </div>
            </div>
            <p className="profile-description">Factory profile information provided by {profile.fullName || "your account"}.</p>
            <div className="profile-quick-stats">
              <span><strong>{capacity}</strong><small>Monthly capacity</small></span>
              <span><strong>{profile.moq > 0 ? `${profile.moq.toLocaleString()} pcs` : "Not provided"}</strong><small>Minimum order quantity</small></span>
              <span><strong>{profile.processes.length}</strong><small>Production processes</small></span>
              <span><strong>{profile.products.length}</strong><small>Product categories</small></span>
            </div>
          </section>
          <div className="workspace-two-col">
            <section className="workspace-panel">
              <SectionHeading title="Manufacturing capabilities" action="Edit" onAction={() => { setDraft(profile); setSaveError(""); setEditing(true); }} />
              <h4 className="profile-subhead">Processes</h4>
              <div className="factory-tags profile-tags">{profile.processes.length ? profile.processes.map((item) => <span key={item}>{item}</span>) : <span>Not provided</span>}</div>
              <h4 className="profile-subhead">Product categories</h4>
              <div className="factory-tags profile-tags">{profile.products.length ? profile.products.map((item) => <span key={item}>{item}</span>) : <span>Not provided</span>}</div>
            </section>
            <section className="workspace-panel">
              <SectionHeading title="Contact information" action="Edit" onAction={() => { setDraft(profile); setSaveError(""); setEditing(true); }} />
              <div className="contact-detail"><Building2 size={16} /><span><b>Factory location</b><small>{location}</small></span></div>
              <div className="contact-detail"><Mail size={16} /><span><b>Business email</b><small>{profile.email || "Not provided"}</small></span></div>
              <div className="contact-detail"><MessageSquare size={16} /><span><b>Contact number</b><small>{profile.phone || "Not provided"}</small></span></div>
              <div className="contact-detail"><ArrowUpRight size={16} /><span><b>Factory website</b><small>{websiteUrl ? <a href={websiteUrl} target="_blank" rel="noreferrer">{profile.website}</a> : "Not provided"}</small></span></div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function BuyerCompanyProfile({
  profile,
  onEdit,
}: {
  profile: BuyerProfileDetails;
  onEdit: () => void;
}) {
  const companyLogoText = (profile.companyName || profile.fullName || "MB").trim().slice(0, 2).toUpperCase();
  const websiteHref = profile.website
    ? /^https?:\/\//i.test(profile.website)
      ? profile.website
      : `https://${profile.website}`
    : "";

  return (
    <>
      <SectionHeading
        eyebrow="YOUR BRAND IDENTITY"
        title="Company profile"
        description="Keep your company information up to date for factory partners."
        action="Edit profile"
        onAction={onEdit}
      />
      <div className="workspace-two-col">
        <section className="workspace-panel profile-banner">
          <div className="profile-cover" />
          <div className="profile-main-info">
            <div className="factory-logo buyer-logo">
              {profile.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoURL} alt={profile.companyName || profile.fullName} className="buyer-logo-img" />
              ) : (
                companyLogoText
              )}
            </div>
          </div>
          <h2 className="company-profile-name">{profile.companyName || "My Brand"}</h2>
          <p className="profile-description">
            Registered buyer workspace managed by {profile.fullName || profile.email}. Connect with verified factories and share production briefs directly.
          </p>
          <div className="profile-detail-list">
            <span>Buyer type</span>
            <b>{profile.buyerType || "Clothing Brand"}</b>
            <span>Country</span>
            <b>{profile.country || "Not provided"}</b>
            <span>Website</span>
            <b>
              {websiteHref ? (
                <a href={websiteHref} target="_blank" rel="noreferrer" className="buyer-profile-link">
                  {profile.website}
                </a>
              ) : (
                "Not provided"
              )}
            </b>
          </div>
        </section>
        <section className="workspace-panel">
          <SectionHeading title="Account contact" />
          <div className="contact-detail">
            <Users size={16} />
            <span>
              <b>{profile.fullName || "Buyer account"}</b>
              <small>{profile.buyerType || "Brand Partner"}</small>
            </span>
          </div>
          <div className="contact-detail">
            <Mail size={16} />
            <span>
              <b>Email address</b>
              <small>{profile.email}</small>
            </span>
          </div>
          <div className="contact-detail">
            <MessageSquare size={16} />
            <span>
              <b>Phone number</b>
              <small>{profile.phone || "Not provided"}</small>
            </span>
          </div>
          <button className="outline-wide-button" onClick={onEdit}>
            Edit profile in Settings <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </>
  );
}

function BuyerGenericPage({
  page,
  onContact,
  onNavigate,
  saved,
  onToggleSave,
  factories,
  onViewFactory,
  requests,
  quotes,
  orders,
  onRequestOrder,
  onRetryOrder,
  quoteFeedError,
  orderFeedError,
  storageError,
  buyerProfile,
  onSaveBuyerProfile,
  buyerTheme,
  onChangeBuyerTheme,
  onResetBuyerAccount,
  onDeleteBuyerAccount,
}: {
  page: string;
  onContact: (title: string) => void;
  onNavigate: (label: string) => void;
  saved: string[];
  onToggleSave: (name: string) => void;
  factories: FactoryCard[];
  onViewFactory: (factory: FactoryCard) => void;
  requests: BuyerRequestRow[];
  quotes: StoredQuote[];
  orders: DashboardOrder[];
  onRequestOrder: (quote: StoredQuote) => Promise<RequestSubmissionResult>;
  onRetryOrder: (orderId: string) => Promise<void>;
  quoteFeedError: string;
  orderFeedError: string;
  storageError: string;
  buyerProfile?: BuyerProfileDetails;
  onSaveBuyerProfile?: (profile: BuyerProfileDetails) => Promise<string>;
  buyerTheme?: BuyerTheme;
  onChangeBuyerTheme?: (theme: BuyerTheme) => Promise<void> | void;
  onResetBuyerAccount?: () => Promise<string>;
  onDeleteBuyerAccount?: (password: string) => Promise<void>;
}) {
  if (page === "Find Factories") return null;
  if (page === "Post Production Request") return null;
  if (page === "My Requests") return <BuyerRequestsPage requests={requests} storageError={storageError} onNewRequest={() => onNavigate("Post Production Request")} />;
  if (page === "Received Quotations") return <BuyerQuotations onContact={onContact} onNavigate={onNavigate} onRequestOrder={onRequestOrder} orders={orders} quotes={quotes} quoteFeedError={quoteFeedError} />;
  if (page === "My Orders") return <OrdersPage onContact={onContact} orders={orders} onRetryOrder={onRetryOrder} feedError={orderFeedError} />;
  if (page === "Saved Factories") {
    return (
      <>
        <SectionHeading eyebrow="YOUR SHORTLIST" title="Saved factories" description="Keep your favorite manufacturing partners close at hand." />
        {saved.length ? <div className="marketplace-grid">{factories.filter((factory) => saved.includes(factory.id)).map((factory) => <FactoryCardView key={factory.id} factory={factory} saved onSave={() => onToggleSave(factory.id)} onContact={() => onViewFactory(factory)} />)}</div> : <EmptyState title="No saved factories yet" description="Save a factory from the marketplace and it will appear here." action="Find factories" onAction={() => onNavigate("Find Factories")} />}
      </>
    );
  }
  if (page === "Company Profile" && buyerProfile) {
    return <BuyerCompanyProfile profile={buyerProfile} onEdit={() => onNavigate("Settings")} />;
  }
  if (page === "Settings" && buyerProfile && onSaveBuyerProfile && onChangeBuyerTheme && onResetBuyerAccount && onDeleteBuyerAccount) {
    return (
      <BuyerSettingsPage
        profile={buyerProfile}
        theme={buyerTheme ?? "default"}
        onSaveProfile={onSaveBuyerProfile}
        onChangeTheme={onChangeBuyerTheme}
        onResetAccount={onResetBuyerAccount}
        onDeleteAccount={onDeleteBuyerAccount}
      />
    );
  }
  return <UtilityPage page={page} onContact={onContact} />;
}

function FactoryGenericPage({
  page,
  onContact,
  onViewOpportunity,
  onQuoteOpportunity,
  quotes,
  quoteFeedError,
  orders,
  orderFeedError,
  onConfirmOrder,
  factoryProfile,
  onSaveFactoryProfile,
  requests,
  requestFeedError,
}: {
  page: string;
  onContact: (title: string) => void;
  onViewOpportunity: (request: FactoryOpportunity) => void;
  onQuoteOpportunity: (request: FactoryOpportunity) => void;
  quotes: StoredQuote[];
  quoteFeedError: string;
  orders: DashboardOrder[];
  orderFeedError: string;
  onConfirmOrder: (orderId: string) => Promise<void>;
  factoryProfile?: FactoryProfileDetails;
  onSaveFactoryProfile?: (profile: FactoryProfileDetails) => Promise<string>;
  requests: FactoryOpportunity[];
  requestFeedError: string;
}) {
  if (page === "Factory Profile") {
    if (!factoryProfile || !onSaveFactoryProfile) {
      return <EmptyState title="Factory profile unavailable" description="Your factory account details could not be loaded." action="Contact support" onAction={() => onContact("Contact support")} />;
    }
    return <FactoryProfile profile={factoryProfile} onSave={onSaveFactoryProfile} />;
  }
  if (page === "Available Capacity") return <CapacityManagement onContact={onContact} />;
  if (page === "Production Requests") return <FactoryRequests onViewOpportunity={onViewOpportunity} onQuoteOpportunity={onQuoteOpportunity} requests={requests} requestFeedError={requestFeedError} />;
  if (page === "Received Orders") return <OrdersPage factory onContact={onContact} orders={orders} onConfirmOrder={onConfirmOrder} feedError={orderFeedError} />;
  if (page === "My Quotations") return <FactoryQuotations onContact={onContact} quotes={quotes} orders={orders} quoteFeedError={quoteFeedError} />;
  if (page === "Manufacturing Capabilities") {
    if (!factoryProfile || !onSaveFactoryProfile) {
      return <EmptyState title="Factory profile unavailable" description="Your factory capabilities could not be loaded." action="Contact support" onAction={() => onContact("Contact support")} />;
    }
    return <CapabilitiesPage profile={factoryProfile} onSave={onSaveFactoryProfile} />;
  }
  if (page === "Production Management") return <ProductionManagement onContact={onContact} />;
  return <UtilityPage page={page} onContact={onContact} />;
}

function CapabilitiesPage({
  profile,
  onSave,
}: {
  profile: FactoryProfileDetails;
  onSave: (profile: FactoryProfileDetails) => Promise<string>;
}) {
  const [processes, setProcesses] = useState(profile.processes);
  const [products, setProducts] = useState(profile.products);
  const [workerCount, setWorkerCount] = useState(profile.workerCount?.toString() ?? "");
  const [productionLines, setProductionLines] = useState(profile.productionLines?.toString() ?? "");
  const [machineInformation, setMachineInformation] = useState(profile.machineInformation ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  function toggle(value: string, values: string[], update: (next: string[]) => void) {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  async function submitCapabilities(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const message = await onSave({
        ...profile,
        processes,
        products,
        workerCount: workerCount.trim() ? Number(workerCount) : undefined,
        productionLines: productionLines.trim() ? Number(productionLines) : undefined,
        machineInformation: machineInformation.trim() || undefined,
      });
      setSaveMessage(message);
    } catch (error) {
      console.error("[Factory capabilities] Failed to save capabilities:", error);
      setSaveError(error instanceof Error ? error.message : "The manufacturing capabilities could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionHeading eyebrow="SHOW WHAT YOU DO BEST" title="Manufacturing capabilities" description="Accurate capability details improve your AI matches and help buyers find the right partner." />
      {saveMessage && <div className="profile-save-message" role="status"><CheckCircle2 size={16} />{saveMessage}</div>}
      <form className="workspace-panel capability-editor" onSubmit={submitCapabilities}>
        <div className="request-form-section"><span className="form-step-number">01</span><div><h3>Processes &amp; expertise</h3><p>Select all processes available at your facility.</p></div></div>
        <h4 className="profile-subhead">Manufacturing processes</h4>
        <div className="selectable-chips">{processOptions.map((option) => <button type="button" className={processes.includes(option) ? "chip-selected" : ""} key={option} onClick={() => toggle(option, processes, setProcesses)}>{processes.includes(option) && <Check size={13} />}{option}</button>)}</div>
        <h4 className="profile-subhead">Product categories</h4>
        <div className="selectable-chips">{productOptions.map((option) => <button type="button" className={products.includes(option) ? "chip-selected" : ""} key={option} onClick={() => toggle(option, products, setProducts)}>{products.includes(option) && <Check size={13} />}{option}</button>)}</div>
        <div className="request-form-grid capabilities-details">
          <label className="workspace-field"><span>Number of workers</span><input type="number" min="0" step="1" value={workerCount} onChange={(event) => setWorkerCount(event.target.value)} placeholder="Not provided" /></label>
          <label className="workspace-field"><span>Production lines</span><input type="number" min="0" step="1" value={productionLines} onChange={(event) => setProductionLines(event.target.value)} placeholder="Not provided" /></label>
          <label className="workspace-field field-full"><span>Machine information</span><textarea rows={3} value={machineInformation} onChange={(event) => setMachineInformation(event.target.value)} placeholder="Describe the machinery available at your facility." /></label>
        </div>
        {saveError && <div className="profile-edit-error" role="alert">{saveError}</div>}
        <div className="request-form-footer">
          <span><ShieldCheck size={15} /> Your capabilities are shared on your public factory profile.</span>
          <button type="submit" className="workspace-primary-button" disabled={saving}>{saving ? "Saving capabilities..." : <>Save capabilities <Check size={15} /></>}</button>
        </div>
      </form>
    </>
  );
}

function ProductionManagement({ onContact }: { onContact: (title: string) => void }) {
  return (
    <>
      <SectionHeading eyebrow="ON THE FLOOR" title="Production management" description="Monitor progress across your active production lines." />
      <div className="workspace-stats compact-stats"><article className="workspace-stat-card"><span className="stat-label">In production</span><div className="stat-value-line"><strong>7</strong></div><span className="stat-card-note">Active order lines</span></article><article className="workspace-stat-card"><span className="stat-label">On schedule</span><div className="stat-value-line"><strong>86%</strong></div><span className="stat-card-note">Across active orders</span></article><article className="workspace-stat-card"><span className="stat-label">Due this month</span><div className="stat-value-line"><strong>2</strong></div><span className="stat-card-note">Next: Nov 20</span></article><article className="workspace-stat-card"><span className="stat-label">Units in progress</span><div className="stat-value-line"><strong>18.6k</strong></div><span className="stat-card-note">Across 4 production lines</span></article></div>
      <section className="workspace-panel"><SectionHeading title="Active production lines" action="Export report" onAction={() => onContact("Production report exported")} /><div className="production-lines">{orderRows.map((order, index) => <article className="production-line" key={order.id}><span className={`line-icon line-${index + 1}`}><Shirt size={17} /></span><div className="production-line-info"><div><strong>{order.product}</strong><span>{order.id} <i>·</i> {order.quantity}</span></div><ProgressBar value={order.progress} label={["Cutting & preparation", "Sewing in progress", "Quality inspection"][index]} /></div><div className="production-line-date"><small>Delivery</small><b>{order.date}</b></div><button className="icon-quiet" onClick={() => onContact(order.id)} aria-label={`More options for ${order.id}`}><MoreHorizontal size={19} /></button></article>)}</div></section>
    </>
  );
}

function UtilityPage({ page, onContact }: { page: string; onContact: (title: string) => void }) {
  if (page === "Messages") return <MessagesPage onContact={onContact} />;
  if (page === "Company Profile") return <CompanyProfile onContact={onContact} />;
  if (page === "Reviews & Ratings") return <ReviewsPage />;
  if (page === "Verification Documents") return <DocumentsPage onContact={onContact} />;
  if (page === "Settings") return <SettingsPage onContact={onContact} />;
  return <EmptyState title={page} description="This workspace is ready for your next step. Add details or explore the other dashboard tools." action="Back to overview" onAction={() => onContact("Overview")} />;
}

function CompanyProfile({ onContact }: { onContact: (title: string) => void }) {
  return (
    <>
      <SectionHeading eyebrow="YOUR BRAND IDENTITY" title="Company profile" description="Keep your company information up to date for factory partners." action="Edit profile" onAction={() => onContact("Edit company profile")} />
      <div className="workspace-two-col"><section className="workspace-panel profile-banner"><div className="factory-logo buyer-logo">N<span>✦</span></div><h2 className="company-profile-name">Northstar Studio</h2><p className="profile-description">Thoughtful essentials for everyday life. We make considered, quality apparel with a focus on responsible materials and timeless design.</p><div className="profile-detail-list"><span>Company type</span><b>Independent clothing brand</b><span>Country</span><b>Copenhagen, Denmark</b><span>Website</span><b>northstarstudio.example</b></div></section><section className="workspace-panel"><SectionHeading title="Account contact" /><div className="contact-detail"><Users size={16} /><span><b>Alex Morgan</b><small>Founder &amp; production lead</small></span></div><div className="contact-detail"><Mail size={16} /><span><b>Email address</b><small>alex@northstarstudio.example</small></span></div><button className="outline-wide-button" onClick={() => onContact("Edit company profile")}>Edit company details <ArrowRight size={14} /></button></section></div>
    </>
  );
}

function MessagesPage({ onContact }: { onContact: (title: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const conversations = [
    { name: "Evergreen Apparel Ltd.", subject: "Re: Organic cotton tee production", time: "10:42 AM", unread: true, color: "mint" },
    { name: "Meridian Garments", subject: "Updated quotation for your RFQ", time: "Yesterday", unread: true, color: "blue" },
    { name: "Thread & Loom Works", subject: "Sample approval and next steps", time: "Nov 09", unread: false, color: "amber" },
  ];
  return (
    <>
      <SectionHeading eyebrow="STAY IN THE LOOP" title="Messages" description="Keep every production conversation in one place." />
      <div className="messages-layout workspace-panel"><div className="conversation-list">{conversations.map((conversation, index) => <button className={`conversation-preview ${selected === index ? "conversation-selected" : ""}`} onClick={() => setSelected(index)} key={conversation.name}><span className={`quote-avatar avatar-${conversation.color}`}>{initials(conversation.name)}</span><span><b>{conversation.name}</b><small>{conversation.subject}</small></span><span className="conversation-time">{conversation.time}{conversation.unread && <i />}</span></button>)}</div><div className="conversation-thread"><div className="thread-header"><span className="quote-avatar">{initials(conversations[selected].name)}</span><span><b>{conversations[selected].name}</b><small><span className="online-dot" /> Online now</small></span><button className="icon-quiet" onClick={() => onContact("Conversation details")}><MoreHorizontal size={19} /></button></div><div className="thread-date">TODAY, NOVEMBER 11</div><div className="message-bubble received">Hi Alex! We reviewed the tech pack and can confirm we can meet the requested delivery date. We&apos;ll send the updated sample photos shortly.<small>10:24 AM</small></div><div className="message-bubble sent">That sounds great, thank you! Please include a close-up of the fabric texture if possible.<small>10:31 AM <Check size={11} /></small></div><div className="message-bubble received">Absolutely — we&apos;ll share those this afternoon.</div><form className="message-composer" onSubmit={(event) => { event.preventDefault(); if (message.trim()) { onContact("Message sent"); setMessage(""); } }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message..." /><button aria-label="Send message" type="submit"><Send size={16} /></button></form></div></div>
    </>
  );
}

function ReviewsPage() {
  return <><SectionHeading eyebrow="TRUST BUILT TOGETHER" title="Reviews & ratings" description="See what your brand partners have to say about working with your factory." /><div className="workspace-two-col"><section className="workspace-panel review-summary"><span className="review-score">4.9 <Star size={22} fill="currentColor" /></span><span className="review-outof">out of 5</span><span className="review-total">Based on 38 verified reviews</span>{[5,4,3,2,1].map((star) => <div className="review-rating-row" key={star}><span>{star} <Star size={11} fill="currentColor" /></span><div><i style={{ width: `${star === 5 ? 78 : star === 4 ? 17 : 3}%` }} /></div><small>{star === 5 ? 30 : star === 4 ? 6 : star === 3 ? 2 : 0}</small></div>)}</section><section className="workspace-panel"><SectionHeading title="Recent feedback" /><div className="review-item"><div><b>Northstar Studio</b><span>★★★★★</span></div><p>Excellent communication and beautiful quality. The team was proactive throughout the entire production run.</p><small>Organic cotton tees · Oct 28, 2026</small></div><div className="review-item"><div><b>Fieldwork Goods</b><span>★★★★★</span></div><p>Reliable partner and clear updates at every stage. We&apos;re already planning our next collection.</p><small>Relaxed-fit overshirt · Sep 14, 2026</small></div></section></div></>;
}

function DocumentsPage({ onContact }: { onContact: (title: string) => void }) {
  const docs = [{ name: "GOTS Certificate", authority: "Control Union", expiry: "Expires Aug 18, 2027", status: "Verified", tone: "teal" }, { name: "OEKO-TEX® Standard 100", authority: "Hohenstein", expiry: "Expires Nov 30, 2026", status: "Expiring soon", tone: "amber" }, { name: "BSCI Audit Report", authority: "amfori", expiry: "Expires Jan 14, 2027", status: "Verified", tone: "teal" }];
  return <><SectionHeading eyebrow="TRUST & COMPLIANCE" title="Verification documents" description="Manage the certificates and audits that support your verified profile." action="Upload document" onAction={() => onContact("Upload verification document")} /><div className="document-list workspace-panel">{docs.map((doc) => <article className="document-item" key={doc.name}><span className="document-icon"><FileCheck2 size={19} /></span><span className="document-name"><b>{doc.name}</b><small>{doc.authority} <i>·</i> {doc.expiry}</small></span><StatusBadge tone={doc.tone}>{doc.status}</StatusBadge><button className="icon-quiet" onClick={() => onContact(`View ${doc.name}`)} aria-label={`View ${doc.name}`}><Eye size={16} /></button><button className="icon-quiet" onClick={() => onContact(`Download ${doc.name}`)} aria-label={`Download ${doc.name}`}><Download size={16} /></button></article>)}<button className="document-upload" onClick={() => onContact("Upload verification document")}><Plus size={16} /> Add another certificate</button></div></>;
}

function SettingsPage({ onContact }: { onContact: (title: string) => void }) {
  return <><SectionHeading eyebrow="MAKE IT YOURS" title="Settings" description="Manage your account preferences and how we keep you in the loop." /><div className="workspace-two-col"><section className="workspace-panel"><SectionHeading title="Notifications" description="Choose the updates you would like to receive." />{["New quotation received", "Production updates", "New matching opportunities", "Messages from partners"].map((name, index) => <label className="setting-row" key={name}><span><b>{name}</b><small>{["When a factory responds to your request", "Milestones and order status changes", "Factories matching your requirements", "New messages and replies"][index]}</small></span><input type="checkbox" defaultChecked={index !== 2} /></label>)}</section><section className="workspace-panel"><SectionHeading title="Account security" /><div className="contact-detail"><ShieldCheck size={16} /><span><b>Password</b><small>Last changed 3 months ago</small></span></div><button className="outline-wide-button" onClick={() => onContact("Password updated")}>Change password <ArrowRight size={14} /></button><div className="contact-detail"><Bell size={16} /><span><b>Two-step verification</b><small>Add another layer of account security</small></span></div><button className="outline-wide-button" onClick={() => onContact("Two-step verification setup")}>Set up verification <ArrowRight size={14} /></button></section></div></>;
}

function EmptyState({ title, description, action, onAction }: { title: string; description: string; action: string; onAction: () => void }) {
  return <div className="workspace-empty"><span><CircleHelp size={22} /></span><h2>{title}</h2><p>{description}</p><button className="workspace-primary-button" onClick={onAction}>{action}<ArrowRight size={15} /></button></div>;
}

export function DashboardWorkspace({
  role,
  fullName,
  userId,
  userEmail,
  factoryProfile,
  onSaveFactoryProfile,
  buyerProfile,
  onSaveBuyerProfile,
  buyerTheme,
  onChangeBuyerTheme,
  onResetBuyerAccount,
  onDeleteBuyerAccount,
  onLogout,
}: {
  role: DashboardRole;
  fullName: string;
  userId?: string;
  userEmail?: string;
  factoryProfile?: FactoryProfileDetails;
  onSaveFactoryProfile?: (profile: FactoryProfileDetails) => Promise<string>;
  buyerProfile?: BuyerProfileDetails;
  onSaveBuyerProfile?: (profile: BuyerProfileDetails) => Promise<string>;
  buyerTheme?: BuyerTheme;
  onChangeBuyerTheme?: (theme: BuyerTheme) => Promise<void> | void;
  onResetBuyerAccount?: () => Promise<string>;
  onDeleteBuyerAccount?: (password: string) => Promise<void>;
  onLogout: () => void;
}) {
  const nav = role === "buyer" ? buyerNav : factoryNav;
  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => (role === "buyer" ? loadBuyerSavedFactories(userEmail) : []));
  const [factories, setFactories] = useState<FactoryCard[]>(() => role === "buyer" ? getLocalFactoryCards() : []);
  const [factoriesLoading, setFactoriesLoading] = useState(role === "buyer");
  const [factoryDirectoryError, setFactoryDirectoryError] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dialog, setDialog] = useState("");
  const [selectedFactory, setSelectedFactory] = useState<FactoryCard | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<FactoryOpportunity | null>(null);
  const [quotingOpportunity, setQuotingOpportunity] = useState<FactoryOpportunity | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteLeadTime, setQuoteLeadTime] = useState("");
  const [quoteTerms, setQuoteTerms] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [quoteSyncMessage, setQuoteSyncMessage] = useState("");
  const [quoteState, setQuoteState] = useState<{ ownerKey: string; quotes: StoredQuote[] }>({ ownerKey: "", quotes: [] });
  const [quoteFeedError, setQuoteFeedError] = useState("");
  const [orderState, setOrderState] = useState<{ ownerKey: string; orders: DashboardOrder[] }>({ ownerKey: "", orders: [] });
  const [orderFeedError, setOrderFeedError] = useState("");
  const [logoutConfirmed, setLogoutConfirmed] = useState(false);
  const [productionRequests, setProductionRequests] = useState<BuyerRequestRow[]>([]);
  const [requestStorageError, setRequestStorageError] = useState("");
  const [factoryRequests, setFactoryRequests] = useState<FactoryOpportunity[]>([]);
  const [factoryRequestFeedError, setFactoryRequestFeedError] = useState("");

  const displayName = role === "buyer" ? buyerProfile?.fullName || fullName : fullName;
  const buyerCompanyName = role === "buyer" ? buyerProfile?.companyName?.trim() || "Northstar Studio" : "";
  const buyerAvatarUrl = role === "buyer" ? buyerProfile?.photoURL?.trim() || "" : "";
  const firstName = displayName.split(/\s+/)[0] || (role === "buyer" ? "Alex" : "Samira");
  const subtitle = role === "buyer" ? "BUYER WORKSPACE" : "FACTORY WORKSPACE";
  const quoteOwnerKey = `${role}:${userId ?? ""}:${userEmail?.trim().toLowerCase() ?? ""}`;
  const storedQuotes = quoteState.ownerKey === quoteOwnerKey ? quoteState.quotes : [];
  const storedOrders = orderState.ownerKey === quoteOwnerKey ? orderState.orders : [];
  const visibleRequests = [...productionRequests, ...requestRows];
  const enrichedRequests = visibleRequests.map((row) => enrichBuyerRequestRow(row, storedQuotes, storedOrders));

  useEffect(() => {
    if (role !== "buyer" || !userId || !userEmail || typeof indexedDB === "undefined") return;

    let active = true;
    const ownerEmail = userEmail.trim().toLowerCase();
    const syncBuyerRequests = async () => {
      try {
        const localRequests = await loadProductionRequests(userId, ownerEmail);
        if (!active) return;
        setProductionRequests(localRequests);
        setRequestStorageError("");

        const firebaseUser = await ensureFirebaseAccountSession(ownerEmail);
        if (!active || !firebaseUser) return;

        const remoteSnapshot = await getDocs(query(
          collection(db, "orders"),
          where("buyerId", "==", firebaseUser.uid),
        ));
        if (!active) return;

        const remoteRequestIds = new Set(
          remoteSnapshot.docs
            .filter((requestDoc) => requestDoc.data().factoryId === null)
            .map((requestDoc) => requestDoc.id),
        );

        let updatedAny = false;
        const nextRequests = await Promise.all(localRequests.map(async (requestRow) => {
          if (requestRow.isOnline && requestRow.ownerId === firebaseUser.uid) {
            return requestRow;
          }
          if (!remoteRequestIds.has(requestRow.id)) {
            try {
              await shareProductionRequest(requestRow, firebaseUser.uid);
            } catch (syncError) {
              console.warn("[Buyer request] Could not sync local request online:", syncError);
              return requestRow;
            }
          }
          const onlineRow: BuyerRequestRow = {
            ...requestRow,
            ownerId: firebaseUser.uid,
            ownerEmail,
            isOnline: true,
          };
          updatedAny = true;
          await saveProductionRequest(onlineRow);
          return onlineRow;
        }));

        if (active && updatedAny) {
          setProductionRequests(nextRequests);
          notifyProductionRequestCreated();
        }
      } catch (error) {
        console.error("[Buyer request] Failed to load saved production requests:", error);
        if (active) setRequestStorageError("Saved requests could not be loaded from this browser.");
      }
    };

    void syncBuyerRequests();

    return () => {
      active = false;
    };
  }, [role, userId, userEmail]);

  useEffect(() => {
    if (role !== "factory" || typeof indexedDB === "undefined") return;

    let active = true;
    const refreshLocalRequests = async () => {
      try {
        const localRequests = await loadAllProductionRequests();
        if (active) {
          setFactoryRequests((current) =>
            mergeFactoryOpportunities(current, localRequests.map(toFactoryOpportunity)),
          );
        }
      } catch (error) {
        console.error("[Factory requests] Failed to load browser-saved requests:", error);
        if (active) setFactoryRequestFeedError("Requests saved in this browser could not be loaded.");
      }
    };

    void refreshLocalRequests();
    if (userEmail) {
      void ensureFirebaseAccountSession(userEmail);
    }
    const onLocalRequestUpdate = () => void refreshLocalRequests();
    window.addEventListener("garmentconnect:production-requests-updated", onLocalRequestUpdate);
    const channel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("garmentconnect-production-requests")
      : null;
    if (channel) channel.onmessage = onLocalRequestUpdate;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      if (!firebaseUser) {
        setFactoryRequestFeedError("");
        return;
      }
      if (userEmail && firebaseUser.email?.toLowerCase() !== userEmail.trim().toLowerCase()) {
        return;
      }

      try {
        const snapshot = await getDocs(query(
          collection(db, "orders"),
          where("factoryId", "==", null),
        ));
        if (!active) return;
        const remoteRequests = snapshot.docs
          .filter((request) => request.data().status === "PENDING_QUOTE")
          .map((request) => toRemoteFactoryOpportunity(request.data(), request.id))
          .filter((request): request is FactoryOpportunity => request !== null);
        setFactoryRequests((current) => mergeFactoryOpportunities(current, remoteRequests));
        setFactoryRequestFeedError("");
      } catch (error) {
        console.error("[Factory requests] Failed to load online buyer requests:", error);
        if (active) setFactoryRequestFeedError("Online buyer requests could not be loaded. Showing requests saved in this browser.");
      }
    });

    return () => {
      active = false;
      window.removeEventListener("garmentconnect:production-requests-updated", onLocalRequestUpdate);
      channel?.close();
      unsubscribe();
    };
  }, [role, userEmail]);

  useEffect(() => {
    if (role !== "buyer") return;

    let active = true;
    const localFactories = getLocalFactoryCards();
    getDocs(collection(db, "factories"))
      .then((snapshot) => {
        if (!active) return;
        const remoteFactories = snapshot.docs.map((factoryDocument) =>
          toFactoryCard(factoryDocument.data(), factoryDocument.id),
        );
        setFactories(mergeFactoryCards(remoteFactories, localFactories));
        setFactoryDirectoryError("");
      })
      .catch((error: unknown) => {
        console.error("[Factory directory] Failed to load Firestore profiles:", error);
        if (!active) return;
        setFactories(localFactories);
        setFactoryDirectoryError(localFactories.length
          ? "The online directory is unavailable. Showing profiles saved in this browser."
          : "Factory profiles could not be loaded. Please try again later.");
      })
      .finally(() => {
        if (active) setFactoriesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role]);

  useEffect(() => {
    if (!userId || !userEmail) return;
    let active = true;
    let stopRemoteQuotes = () => {};
    const reloadLocalQuotes = () => {
      if (typeof indexedDB === "undefined") {
        if (active) setQuoteFeedError("This browser does not support local quotation storage.");
        return;
      }
      void loadStoredQuotes(role, userId, userEmail)
        .then((quotes) => {
          if (active) {
            setQuoteState((current) => ({
              ownerKey: quoteOwnerKey,
              quotes: mergeStoredQuotes(current.ownerKey === quoteOwnerKey ? current.quotes : [], quotes),
            }));
            setQuoteFeedError("");
          }
        })
        .catch((error: unknown) => {
          console.error("[Quotations] Failed to load browser-saved quotations:", error);
          if (active) setQuoteFeedError("Saved quotations could not be loaded from this browser.");
        });
    };

    reloadLocalQuotes();
    void ensureFirebaseAccountSession(userEmail);
    const onLocalQuoteUpdate = () => reloadLocalQuotes();
    window.addEventListener("garmentconnect:quotes-updated", onLocalQuoteUpdate);
    const channel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("garmentconnect-production-quotes")
      : null;
    if (channel) channel.onmessage = onLocalQuoteUpdate;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      stopRemoteQuotes();
      stopRemoteQuotes = () => {};
      if (!active || !firebaseUser || firebaseUser.email?.toLowerCase() !== userEmail.trim().toLowerCase()) return;

      const ownerField = role === "buyer" ? "buyerId" : "factoryId";
      stopRemoteQuotes = onSnapshot(
        query(collection(db, "quotes"), where(ownerField, "==", firebaseUser.uid)),
        (snapshot) => {
          if (!active) return;
          const remoteQuotes = snapshot.docs
            .map((quoteDocument) => toStoredQuote(quoteDocument.data(), quoteDocument.id))
            .filter((quote): quote is StoredQuote => quote !== null);
          setQuoteState((current) => ({
            ownerKey: quoteOwnerKey,
            quotes: mergeStoredQuotes(current.ownerKey === quoteOwnerKey ? current.quotes : [], remoteQuotes),
          }));
          setQuoteFeedError("");
        },
        (error) => {
          console.error("[Quotations] Failed to load online quotations:", error);
          if (active) setQuoteFeedError("Online quotations could not be loaded. Showing quotations saved in this browser.");
        },
      );
    });

    return () => {
      active = false;
      window.removeEventListener("garmentconnect:quotes-updated", onLocalQuoteUpdate);
      channel?.close();
      unsubscribeAuth();
      stopRemoteQuotes();
    };
  }, [role, userId, userEmail, quoteOwnerKey]);

  useEffect(() => {
    if (!userId || !userEmail) return;
    let active = true;
    let stopRemoteOrders = () => {};
    const reloadLocalOrders = () => {
      if (typeof indexedDB === "undefined") {
        if (active) setOrderFeedError("This browser does not support local order storage.");
        return;
      }
      void loadDashboardOrders(role, userId, userEmail)
        .then((orders) => {
          if (active) {
            setOrderState((current) => ({
              ownerKey: quoteOwnerKey,
              orders: mergeDashboardOrders(current.ownerKey === quoteOwnerKey ? current.orders : [], orders),
            }));
            setOrderFeedError("");
          }
        })
        .catch((error: unknown) => {
          console.error("[Orders] Failed to load browser-saved orders:", error);
          if (active) setOrderFeedError("Saved order requests could not be loaded from this browser.");
        });
    };

    reloadLocalOrders();
    void ensureFirebaseAccountSession(userEmail);
    const onLocalOrderUpdate = () => reloadLocalOrders();
    window.addEventListener("garmentconnect:orders-updated", onLocalOrderUpdate);
    const channel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("garmentconnect-orders")
      : null;
    if (channel) channel.onmessage = onLocalOrderUpdate;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      stopRemoteOrders();
      stopRemoteOrders = () => {};
      if (!active || !firebaseUser || firebaseUser.email?.toLowerCase() !== userEmail.trim().toLowerCase()) return;

      const ownerField = role === "buyer" ? "buyerId" : "factoryId";
      stopRemoteOrders = onSnapshot(
        query(collection(db, "orders"), where(ownerField, "==", firebaseUser.uid)),
        (snapshot) => {
          if (!active) return;
          const remoteOrders = snapshot.docs
            .map((orderDocument) => toDashboardOrder(orderDocument.data(), orderDocument.id))
            .filter((order): order is DashboardOrder => order !== null);
          setOrderState((current) => ({
            ownerKey: quoteOwnerKey,
            orders: mergeDashboardOrders(current.ownerKey === quoteOwnerKey ? current.orders : [], remoteOrders),
          }));
          setOrderFeedError("");
        },
        (error) => {
          console.error("[Orders] Failed to load online orders:", error);
          if (active) setOrderFeedError("Online order requests could not be loaded. Showing requests saved in this browser.");
        },
      );
    });

    return () => {
      active = false;
      window.removeEventListener("garmentconnect:orders-updated", onLocalOrderUpdate);
      channel?.close();
      unsubscribeAuth();
      stopRemoteOrders();
    };
  }, [role, userId, userEmail, quoteOwnerKey]);

  function openDialog(title: string) {
    setSelectedFactory(null);
    if (!title.startsWith("Send quotation for ")) setQuotingOpportunity(null);
    setDialog(title);
    setQuotePrice("");
    setQuoteLeadTime("");
    setQuoteTerms("");
    setQuoteError("");
    setQuoteSyncMessage("");
    setLogoutConfirmed(title === "Log out of your account?");
  }

  function openFactoryProfile(factory: FactoryCard) {
    setSelectedFactory(factory);
    setDialog("Factory profile");
    setQuotePrice("");
    setQuoteLeadTime("");
    setQuoteTerms("");
    setQuoteError("");
    setLogoutConfirmed(false);
  }

  function openOpportunityDetails(request: FactoryOpportunity) {
    setSelectedOpportunity(request);
  }

  function openOpportunityQuote(request: FactoryOpportunity) {
    setSelectedOpportunity(null);
    setQuotingOpportunity(request);
    openDialog(`Send quotation for ${request.id}`);
  }

  function closeDialog() {
    setDialog("");
    setSelectedFactory(null);
    setQuotingOpportunity(null);
  }

  async function handleDialogAction() {
    if (selectedFactory) {
      closeDialog();
      return;
    }
    if (logoutConfirmed) {
      onLogout();
      return;
    }
    if (dialog.startsWith("Send quotation for ")) {
      const pricePerUnit = Number(quotePrice);
      if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0 || !quoteLeadTime.trim()) {
        setQuoteError("Enter a valid unit price greater than zero and an estimated lead time.");
        return;
      }
      if (!quotingOpportunity || (!quotingOpportunity.buyerId && !quotingOpportunity.buyerEmail)) {
        setQuoteError("This demo opportunity is not linked to a registered buyer, so it cannot receive a real quotation.");
        return;
      }

      setQuoteSaving(true);
      setQuoteError("");
      let firebaseUser: Awaited<ReturnType<typeof waitForFirebaseUser>>;
      try {
        firebaseUser = await ensureFirebaseAccountSession(userEmail);
      } catch (error) {
        console.error("[Quotations] Failed to restore Firebase sign-in:", error);
        firebaseUser = null;
      }

      const factoryAccount = userEmail ? findAccount(userEmail) : undefined;
      const firebaseFactory = firebaseUser?.email?.toLowerCase() === userEmail?.trim().toLowerCase()
        ? firebaseUser
        : null;

      let effectiveIsOnline = Boolean(quotingOpportunity.isOnline);
      let effectiveBuyerId = quotingOpportunity.buyerId || "";
      if (firebaseFactory && (!effectiveIsOnline || !effectiveBuyerId || effectiveBuyerId.includes("@"))) {
        try {
          const requestSnap = await getDoc(doc(db, "orders", quotingOpportunity.id));
          const requestData = requestSnap.exists() ? requestSnap.data() : null;
          if (requestData && requestData.factoryId === null && requestData.status === "PENDING_QUOTE") {
            effectiveBuyerId = getText(requestData.buyerId) || effectiveBuyerId;
            effectiveIsOnline = Boolean(effectiveBuyerId && !effectiveBuyerId.includes("@"));
          }
        } catch (error) {
          console.warn("[Quotations] Could not inspect remote RFQ state:", error);
        }
      }

      const quote: StoredQuote = {
        id: `QT-${Date.now()}`,
        requestId: quotingOpportunity.id,
        buyerId: effectiveBuyerId,
        buyerEmail: quotingOpportunity.buyerEmail?.trim().toLowerCase() || "",
        buyerName: quotingOpportunity.buyer,
        factoryId: firebaseFactory?.uid || userId || "",
        factoryEmail: userEmail?.trim().toLowerCase() || "",
        factoryName: factoryProfile?.companyName || factoryAccount?.companyName || fullName,
        factoryLocation: [factoryProfile?.city || factoryAccount?.city, factoryProfile?.country || factoryAccount?.country].filter(Boolean).join(", "),
        product: quotingOpportunity.product,
        quantity: quotingOpportunity.quantity,
        pricePerUnit,
        currency: "USD",
        leadTime: quoteLeadTime.trim(),
        terms: quoteTerms.trim(),
        status: "PENDING",
        createdAt: new Date().toISOString(),
        category: quotingOpportunity.category || "Other",
        targetDeliveryDate: quotingOpportunity.deadline,
      };

      const canShareOnline = Boolean(
        firebaseFactory &&
        effectiveIsOnline &&
        quote.buyerId &&
        !quote.buyerId.includes("@"),
      );

      let sharedOnline = false;
      if (canShareOnline) {
        try {
          await setDoc(doc(db, "quotes", quote.id), quote);
          sharedOnline = true;
        } catch (error) {
          console.warn("[Quotations] Could not sync quotation to Firestore, falling back to local workspace storage:", error);
        }
      }

      const savedQuote = { ...quote, isOnline: sharedOnline };
      let locallySaved = false;
      try {
        await saveStoredQuote(savedQuote);
        locallySaved = true;
        notifyQuotesUpdated();
      } catch (error) {
        console.error("[Quotations] Failed to save quotation in this browser:", error);
        if (!sharedOnline) {
          setQuoteError(error instanceof Error
            ? `The quotation could not be saved: ${error.message}`
            : "The quotation could not be saved in this browser.");
          setQuoteSaving(false);
          return;
        }
      }

      setQuoteState((current) => ({
        ownerKey: quoteOwnerKey,
        quotes: mergeStoredQuotes(current.ownerKey === quoteOwnerKey ? current.quotes : [], [savedQuote]),
      }));
      setQuoteSyncMessage(sharedOnline
        ? "Quotation sent to the buyer and synced online. Track responses in My Quotations."
        : locallySaved
          ? "Quotation sent to the buyer. Review and track its status in My Quotations."
          : "Quotation shared online. The buyer can review it in their dashboard.");
      setDialog("Quotation sent");
      setQuoteSaving(false);
      return;
    }
    closeDialog();
  }

  async function placeOrderFromQuote(quote: StoredQuote): Promise<RequestSubmissionResult> {
    if (role !== "buyer" || !userId || !userEmail) {
      throw new Error("Your buyer account could not be identified. Please sign in again.");
    }
    if (storedOrders.some((order) => order.quoteId === quote.id && order.status !== "CANCELLED")) {
      throw new Error("An order request has already been sent for this quotation.");
    }

    const firebaseUser = await ensureFirebaseAccountSession(userEmail);
    const firebaseBuyer = firebaseUser?.email?.toLowerCase() === userEmail.trim().toLowerCase()
      ? firebaseUser
      : null;
    let orderQuote = quote;
    if (firebaseBuyer && !orderQuote.isOnline) {
      try {
        const quoteSnapshot = await getDoc(doc(db, "quotes", quote.id));
        if (quoteSnapshot.exists()) {
          const onlineQuote = toStoredQuote(quoteSnapshot.data(), quoteSnapshot.id);
          if (onlineQuote?.buyerId === firebaseBuyer.uid) orderQuote = onlineQuote;
        }
      } catch (error) {
        console.warn("[Orders] Could not verify remote quotation:", error);
      }
    }

    const now = new Date().toISOString();
    const order: DashboardOrder = {
      id: `ORD-${Date.now()}`,
      quoteId: orderQuote.id,
      requestId: orderQuote.requestId,
      buyerId: firebaseBuyer?.uid || orderQuote.buyerId || userId,
      buyerEmail: userEmail.trim().toLowerCase(),
      buyerName: orderQuote.buyerName || findAccount(userEmail)?.companyName || fullName,
      factoryId: orderQuote.factoryId,
      factoryEmail: orderQuote.factoryEmail,
      factoryName: orderQuote.factoryName,
      product: orderQuote.product,
      productType: orderQuote.category || "Other",
      quantity: orderQuote.quantity,
      targetDeliveryDate: orderQuote.targetDeliveryDate || "",
      pricePerUnit: orderQuote.pricePerUnit,
      currency: orderQuote.currency,
      terms: orderQuote.terms,
      status: "PENDING_FACTORY_CONFIRMATION",
      createdAt: now,
      updatedAt: now,
      isOnline: false,
    };

    const canShareOnline = Boolean(
      orderQuote.isOnline &&
      firebaseBuyer &&
      orderQuote.buyerId === firebaseBuyer.uid &&
      orderQuote.factoryId,
    );

    let syncedOnline = false;
    if (canShareOnline) {
      const remoteOrder = { ...order };
      delete remoteOrder.isOnline;
      try {
        await setDoc(doc(db, "orders", order.id), remoteOrder);
        syncedOnline = true;
      } catch (error) {
        console.warn("[Orders] Could not create Firestore order request, storing in workspace:", error);
      }
    }

    const savedOrder = { ...order, isOnline: syncedOnline };
    await saveDashboardOrder(savedOrder);
    notifyOrdersUpdated();
    notifyQuotesUpdated();

    setOrderState((current) => ({
      ownerKey: quoteOwnerKey,
      orders: mergeDashboardOrders(current.ownerKey === quoteOwnerKey ? current.orders : [], [savedOrder]),
    }));
    return {
      shared: syncedOnline,
      message: "Your order request was sent to the factory and is awaiting confirmation. No payment has been taken.",
    };
  }

  async function retrySendingOrder(orderId: string): Promise<void> {
    if (role !== "buyer" || !userEmail) {
      throw new Error("Sign in to your buyer account before retrying this order.");
    }

    const order = storedOrders.find((item) => item.id === orderId);
    if (!order || order.isOnline || order.status !== "PENDING_FACTORY_CONFIRMATION") {
      throw new Error("This order is not eligible to be sent again.");
    }

    const firebaseUser = await ensureFirebaseAccountSession(userEmail);
    if (!firebaseUser) {
      throw new Error("You are not signed in to Firebase. Sign in to your buyer account and retry.");
    }
    if (firebaseUser.email?.toLowerCase() !== userEmail.trim().toLowerCase()) {
      throw new Error("A different Firebase account is signed in. Switch to your buyer account and retry.");
    }

    let quoteSnapshot;
    try {
      quoteSnapshot = await getDoc(doc(db, "quotes", order.quoteId));
    } catch (error) {
      console.error("[Orders] Failed to verify the quotation before retrying:", error);
      const details = error instanceof Error ? error.message : "The quotation could not be checked.";
      throw new Error(`The order was not synced online. Could not verify its online quotation. ${details}`);
    }

    if (!quoteSnapshot.exists() || quoteSnapshot.data().status !== "PENDING") {
      throw new Error("This order's quotation has not been synced to Firebase yet, so it remains tracked locally.");
    }
    const quote = toStoredQuote(quoteSnapshot.data(), quoteSnapshot.id);
    if (!quote || quote.buyerId !== firebaseUser.uid || quote.requestId !== order.requestId) {
      throw new Error("This order does not match an online quotation for your buyer account.");
    }

    const updatedOrder: DashboardOrder = {
      ...order,
      buyerId: firebaseUser.uid,
      buyerEmail: userEmail.trim().toLowerCase(),
      buyerName: quote.buyerName || order.buyerName,
      factoryId: quote.factoryId,
      factoryEmail: quote.factoryEmail,
      factoryName: quote.factoryName,
      product: quote.product,
      productType: quote.category || order.productType,
      quantity: quote.quantity || order.quantity,
      targetDeliveryDate: quote.targetDeliveryDate || order.targetDeliveryDate,
      pricePerUnit: quote.pricePerUnit,
      currency: quote.currency,
      terms: quote.terms,
      updatedAt: new Date().toISOString(),
      isOnline: true,
    };

    const orderRef = doc(db, "orders", order.id);
    try {
      const existingOrderSnapshot = await getDoc(orderRef);
      if (existingOrderSnapshot.exists()) {
        const existingOrder = toDashboardOrder(existingOrderSnapshot.data(), existingOrderSnapshot.id);
        if (
          !existingOrder ||
          existingOrder.buyerId !== firebaseUser.uid ||
          existingOrder.quoteId !== quote.id ||
          existingOrder.factoryId !== quote.factoryId
        ) {
          throw new Error("An order with this ID already exists and does not match this request.");
        }
        Object.assign(updatedOrder, existingOrder);
      } else {
        const remoteOrder = { ...updatedOrder };
        delete remoteOrder.isOnline;
        await setDoc(orderRef, remoteOrder);
      }
    } catch (error) {
      console.error("[Orders] Failed to resend the saved order request:", error);
      const details = error instanceof Error ? error.message : "Online order storage failed.";
      throw new Error(`The order request could not be sent to the factory. ${details}`);
    }

    await saveDashboardOrder(updatedOrder);
    notifyOrdersUpdated();
    notifyQuotesUpdated();

    setOrderState((current) => ({
      ownerKey: quoteOwnerKey,
      orders: mergeDashboardOrders(current.ownerKey === quoteOwnerKey ? current.orders : [], [updatedOrder]),
    }));
  }

  async function confirmFactoryOrder(orderId: string): Promise<void> {
    if (role !== "factory") throw new Error("Only the factory assigned to an order can confirm it.");
    const order = storedOrders.find((item) => item.id === orderId);
    if (!order || order.status !== "PENDING_FACTORY_CONFIRMATION") {
      throw new Error("This order request is no longer awaiting confirmation.");
    }

    const firebaseUser = await ensureFirebaseAccountSession(userEmail);
    const firebaseFactory = firebaseUser?.email?.toLowerCase() === userEmail?.trim().toLowerCase()
      ? firebaseUser
      : null;
    const updatedOrder: DashboardOrder = {
      ...order,
      status: "CONFIRMED",
      updatedAt: new Date().toISOString(),
    };

    if (order.isOnline && firebaseFactory && firebaseFactory.uid === order.factoryId) {
      try {
        await updateDoc(doc(db, "orders", order.id), {
          status: "CONFIRMED",
          updatedAt: updatedOrder.updatedAt,
        });
      } catch (error) {
        console.warn("[Orders] Could not update Firestore order status, persisting locally:", error);
      }
    }

    await saveDashboardOrder(updatedOrder);
    notifyOrdersUpdated();
    notifyQuotesUpdated();

    setOrderState((current) => ({
      ownerKey: quoteOwnerKey,
      orders: mergeDashboardOrders(current.ownerKey === quoteOwnerKey ? current.orders : [], [updatedOrder]),
    }));
  }

  function navigate(label: string) {
    if (label === "Overview") setActivePage(label);
    else if (nav.some((item) => item.label === label)) setActivePage(label);
    else setDialog(label);
    setMobileOpen(false);
  }

  function toggleSave(name: string) {
    setSaved((current) => {
      const next = current.includes(name) ? current.filter((item) => item !== name) : [...current, name];
      if (role === "buyer") {
        persistBuyerSavedFactories(next, userEmail);
      }
      return next;
    });
  }

  async function handleResetBuyerWorkspace(): Promise<string> {
    if (!onResetBuyerAccount) {
      throw new Error("Account reset is unavailable right now.");
    }
    const message = await onResetBuyerAccount();
    setSaved([]);
    setProductionRequests([]);
    setQuoteState({ ownerKey: quoteOwnerKey, quotes: [] });
    setOrderState({ ownerKey: quoteOwnerKey, orders: [] });
    return message;
  }

  async function addProductionRequest(request: BuyerRequestRow): Promise<RequestSubmissionResult> {
    if (!userId) throw new Error("Your account could not be identified. Please sign in again.");
    const buyerAccount = userEmail ? findAccount(userEmail) : undefined;
    const savedRequest: BuyerRequestRow = {
      ...request,
      buyerName: buyerProfile?.companyName || buyerAccount?.companyName || buyerProfile?.fullName || buyerAccount?.fullName || fullName,
      location: buyerProfile?.country || buyerAccount?.country || "",
      ownerId: userId,
      ownerEmail: userEmail?.trim().toLowerCase(),
      isOnline: false,
    };
    await saveProductionRequest(savedRequest);
    setProductionRequests((current) => [savedRequest, ...current.filter((item) => item.id !== savedRequest.id)]);
    setRequestStorageError("");
    notifyProductionRequestCreated();

    const firebaseUser = await ensureFirebaseAccountSession(userEmail);
    if (!firebaseUser || firebaseUser.email?.toLowerCase() !== userEmail?.trim().toLowerCase()) {
      return {
        shared: false,
        message: "Request saved locally and shared with connected browser tabs. Sign in with Firebase to sync across devices.",
      };
    }

    try {
      await shareProductionRequest(savedRequest, firebaseUser.uid);
      const onlineRequest: BuyerRequestRow = {
        ...savedRequest,
        ownerId: firebaseUser.uid,
        isOnline: true,
      };
      await saveProductionRequest(onlineRequest);
      setProductionRequests((current) => [onlineRequest, ...current.filter((item) => item.id !== onlineRequest.id)]);
      notifyProductionRequestCreated();
      return {
        shared: true,
        message: "Request shared with factories and saved under My Requests.",
      };
    } catch (error) {
      console.error("[Buyer request] Failed to share request with factories:", error);
      return {
        shared: false,
        message: "Request saved locally and shared in this browser; online sync will retry automatically.",
      };
    }
  }

  function pageContent() {
    if (activePage === "Overview") {
      return role === "buyer"
        ? <BuyerOverview onNavigate={navigate} saved={saved} onToggleSave={toggleSave} onContact={openDialog} onViewFactory={openFactoryProfile} firstName={firstName} requests={enrichedRequests} quotes={storedQuotes} orders={storedOrders} factories={factories} factoriesLoading={factoriesLoading} factoryDirectoryError={factoryDirectoryError} />
        : <FactoryOverview onNavigate={navigate} onViewOpportunity={openOpportunityDetails} onQuoteOpportunity={openOpportunityQuote} firstName={firstName} requests={factoryRequests} requestFeedError={factoryRequestFeedError} />;
    }
    if (role === "buyer") {
      if (activePage === "Find Factories") return <Marketplace factories={factories} factoriesLoading={factoriesLoading} factoryDirectoryError={factoryDirectoryError} saved={saved} onToggleSave={toggleSave} onViewFactory={openFactoryProfile} />;
      if (activePage === "Post Production Request") return <PostRequest onSubmitted={addProductionRequest} />;
      return (
        <BuyerGenericPage
          page={activePage}
          onContact={openDialog}
          onNavigate={navigate}
          saved={saved}
          onToggleSave={toggleSave}
          factories={factories}
          onViewFactory={openFactoryProfile}
          requests={enrichedRequests}
          quotes={storedQuotes}
          quoteFeedError={quoteFeedError}
          orders={storedOrders}
          orderFeedError={orderFeedError}
          onRequestOrder={placeOrderFromQuote}
          onRetryOrder={retrySendingOrder}
          storageError={typeof indexedDB === "undefined" ? "This browser does not support saving requests locally." : requestStorageError}
          buyerProfile={buyerProfile}
          onSaveBuyerProfile={onSaveBuyerProfile}
          buyerTheme={buyerTheme}
          onChangeBuyerTheme={onChangeBuyerTheme}
          onResetBuyerAccount={handleResetBuyerWorkspace}
          onDeleteBuyerAccount={onDeleteBuyerAccount}
        />
      );
    }
    return <FactoryGenericPage page={activePage} onContact={openDialog} onViewOpportunity={openOpportunityDetails} onQuoteOpportunity={openOpportunityQuote} quotes={storedQuotes} quoteFeedError={quoteFeedError} orders={storedOrders} orderFeedError={orderFeedError} onConfirmOrder={confirmFactoryOrder} factoryProfile={factoryProfile} onSaveFactoryProfile={onSaveFactoryProfile} requests={factoryRequests} requestFeedError={factoryRequestFeedError} />;
  }

  return (
    <div className={`dashboard-workspace ${role === "factory" ? "factory-workspace" : `buyer-workspace buyer-theme-${buyerTheme ?? "default"}`}`}>
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`workspace-sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand-wrap"><DashboardBrand /><button className="sidebar-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
        <div className="workspace-switch"><span className={`workspace-switch-icon ${role}`}><BriefcaseBusiness size={16} /></span><span><b>{role === "buyer" ? buyerCompanyName : "Evergreen Apparel"}</b><small>{subtitle}</small></span><ChevronDown size={15} /></div>
        <span className="sidebar-label">WORKSPACE</span>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} title={label} aria-label={label} className={`sidebar-link ${activePage === label ? "sidebar-link-active" : ""}`} onClick={() => navigate(label)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {label === "Messages" && <i className="sidebar-count">3</i>}
              {label === "Production Requests" && role === "factory" && <i className="sidebar-count">12</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span><CircleHelp size={16} /></span><b>Need a hand?</b><small>Our team is here to help you.</small><button onClick={() => setDialog("Contact support")}>Get support <ArrowRight size={12} /></button></div>
          <button className="sidebar-link logout-link" onClick={() => openDialog("Log out of your account?")}><LogOut size={17} /><span>Log out</span></button>
          <div className="sidebar-user">
            <span className="user-avatar">
              {buyerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={buyerAvatarUrl} alt={displayName} className="user-avatar-img" />
              ) : (
                initials(displayName || (role === "buyer" ? "Alex Morgan" : "Samira Rahman"))
              )}
            </span>
            <span><b>{displayName}</b><small>{role === "buyer" ? buyerProfile?.buyerType || "Brand account" : "Factory administrator"}</small></span>
            <MoreHorizontal size={17} />
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>{role === "buyer" ? "Buyer" : "Factory"}</span><span>/</span><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <label className="top-search"><Search size={15} /><input placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className={`topbar-icon ${notificationOpen ? "topbar-icon-active" : ""}`} aria-label="Notifications" onClick={() => setNotificationOpen((current) => !current)}><Bell size={18} /><i /></button>
            <span className="topbar-divider" />
            <button className="topbar-user" onClick={() => role === "buyer" ? navigate("Settings") : setDialog("Account profile")}>
              <span className="user-avatar">
                {buyerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={buyerAvatarUrl} alt={displayName} className="user-avatar-img" />
                ) : (
                  initials(displayName || "Alex Morgan")
                )}
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
          {notificationOpen && <div className="notification-popover"><div><strong>Notifications</strong><button onClick={() => setNotificationOpen(false)}><X size={14} /></button></div><p><span className="notification-dot" /><span><b>{role === "buyer" ? "New quotation received" : "New matching request"}</b><small>{role === "buyer" ? "Evergreen Apparel sent a quote · 12 min ago" : "Crewneck tee request matches your profile · 12 min ago"}</small></span></p><p><span className="notification-dot muted-dot" /><span><b>Order update</b><small>Production milestone completed · 2 hours ago</small></span></p><button className="notification-all" onClick={() => { setNotificationOpen(false); navigate("Messages"); }}>View all updates</button></div>}
        </header>
        <main className="workspace-content" key={activePage}>{pageContent()}</main>
        <footer className="workspace-footer"><span>© 2026 Threadline</span><span><a href="#help">Help center</a><a href="#privacy">Privacy</a><a href="#feedback">Send feedback</a></span></footer>
      </div>
      {selectedOpportunity && (
        <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOpportunity(null); }}>
          <section className="workspace-modal request-details-modal" role="dialog" aria-modal="true" aria-labelledby="opportunity-details-title">
            <button className="modal-close" aria-label="Close opportunity details" onClick={() => setSelectedOpportunity(null)}><X size={17} /></button>
            <span className="modal-icon"><ClipboardList size={21} /></span>
            <h2 id="opportunity-details-title">{selectedOpportunity.product}</h2>
            <p>{selectedOpportunity.id} · Production request from {selectedOpportunity.buyer}</p>
            <div className="request-detail-grid">
              <span><small>Product category</small><b>{selectedOpportunity.category || "Not specified"}</b></span>
              <span><small>Quantity</small><b>{selectedOpportunity.quantity}</b></span>
              <span><small>Fabric</small><b>{selectedOpportunity.fabric || "Not specified"}</b></span>
              <span><small>Manufacturing processes</small><b>{selectedOpportunity.processes?.join(", ") || "Not specified"}</b></span>
              <span><small>Delivery date</small><b>{selectedOpportunity.deadline}</b></span>
              <span><small>Buyer location</small><b>{selectedOpportunity.location}</b></span>
              <span><small>Target budget / unit</small><b>{selectedOpportunity.budget ? `$${selectedOpportunity.budget}` : "Not specified"}</b></span>
              <span><small>Quality requirements</small><b>{selectedOpportunity.quality || "Not specified"}</b></span>
            </div>
            <div className="request-detail-instructions">
              <b>Additional instructions</b>
              <p>{selectedOpportunity.instructions || "No additional instructions provided."}</p>
            </div>
            <div className="request-detail-files">
              <b>Reference files ({selectedOpportunity.referenceFileNames?.length ?? 0})</b>
              {selectedOpportunity.referenceFiles?.length
                ? <div className="request-file-list">{selectedOpportunity.referenceFiles.map((file, index) => <ReferenceFilePreview key={`${file.name}-${file.lastModified}-${index}`} file={file} />)}</div>
                : selectedOpportunity.referenceFileNames?.length
                  ? <><ul>{selectedOpportunity.referenceFileNames.map((name) => <li key={name}>{name}</li>)}</ul><p>File contents are not available in this request preview.</p></>
                  : <p>No reference files were attached to this request.</p>}
            </div>
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setSelectedOpportunity(null)}>Close</button>
              <button className="workspace-primary-button" onClick={() => openOpportunityQuote(selectedOpportunity)}>Prepare quotation <ArrowRight size={14} /></button>
            </div>
          </section>
        </div>
      )}
      {dialog && (
        <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" aria-label="Close dialog" onClick={closeDialog}><X size={17} /></button>
            <span className="modal-icon"><CheckCircle2 size={21} /></span>
            <h2 id="modal-title">{selectedFactory?.name ?? dialog}</h2>
            {selectedFactory ? (
              <>
                <p>Factory information shared for buyer discovery.</p>
                <dl className="factory-profile-modal-details">
                  <div><dt>Location</dt><dd>{[selectedFactory.city, selectedFactory.country].filter(Boolean).join(", ") || "Not provided"}</dd></div>
                  <div><dt>Monthly capacity</dt><dd>{selectedFactory.monthlyCapacity ? `${selectedFactory.monthlyCapacity.toLocaleString()} pcs` : "Not provided"}</dd></div>
                  <div><dt>Processes</dt><dd>{selectedFactory.processes.join(", ") || "Not provided"}</dd></div>
                  <div><dt>Products</dt><dd>{selectedFactory.products.join(", ") || "Not provided"}</dd></div>
                  <div><dt>Website</dt><dd>{selectedFactory.website || "Not provided"}</dd></div>
                  <div><dt>Verification</dt><dd>{selectedFactory.verified ? "Verified" : "Not verified"}</dd></div>
                </dl>
              </>
            ) : (
              <p>
                {dialog === "Quotation sent"
                  ? quoteSyncMessage
                  : logoutConfirmed
                    ? "You will be signed out of your Threadline workspace."
                    : dialog.startsWith("Send quotation for ")
                      ? "Provide your unit price, estimated lead time and any additional terms for this buyer."
                      : dialog.includes("RFQ-")
                        ? "Request details, production specifications and buyer information will appear here."
                        : "This frontend demo records your selection locally. No information is sent to a server."}
              </p>
            )}
            {dialog.startsWith("Send quotation for ") && <div className="request-form-grid modal-quote-fields"><label className="workspace-field"><span>Price per unit (USD) *</span><input type="number" min="0.01" step="0.01" value={quotePrice} onChange={(event) => setQuotePrice(event.target.value)} placeholder="e.g. 4.25" /></label><label className="workspace-field"><span>Estimated lead time *</span><input value={quoteLeadTime} onChange={(event) => setQuoteLeadTime(event.target.value)} placeholder="e.g. 35 days" /></label><label className="workspace-field quote-terms-field"><span>Additional terms (optional)</span><textarea value={quoteTerms} onChange={(event) => setQuoteTerms(event.target.value)} rows={3} placeholder="Payment terms, shipping details, or other offer notes" /></label></div>}
            {quoteError && dialog.startsWith("Send quotation for ") && <p className="field-error" role="alert">{quoteError}</p>}
            <div className="modal-actions"><button className="cancel-button" onClick={closeDialog}>{logoutConfirmed ? "Stay here" : "Close"}</button><button className="workspace-primary-button" onClick={handleDialogAction} disabled={quoteSaving}>{logoutConfirmed ? "Log out" : dialog.startsWith("Send quotation for ") ? quoteSaving ? "Sending..." : "Send quotation" : "Got it"}<ArrowRight size={14} /></button></div>
          </section>
        </div>
      )}
    </div>
  );
}
