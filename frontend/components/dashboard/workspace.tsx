"use client";

import { useState } from "react";
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

export type DashboardRole = "buyer" | "factory";

type NavItem = { label: string; icon: LucideIcon };
type FactoryCard = {
  name: string;
  city: string;
  country: string;
  match: number;
  capacity: string;
  capabilities: string[];
  image: string;
  verified: boolean;
  rating: string;
};

const factoryDirectory: FactoryCard[] = [
  {
    name: "Evergreen Apparel Ltd.",
    city: "Dhaka",
    country: "Bangladesh",
    match: 98,
    capacity: "45,000 pcs / month",
    capabilities: ["Cut & sew", "Knitwear", "Organic cotton"],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
    verified: true,
    rating: "4.9",
  },
  {
    name: "Meridian Garments",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    match: 94,
    capacity: "32,000 pcs / month",
    capabilities: ["Denim", "Washing", "Finishing"],
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
    verified: true,
    rating: "4.8",
  },
  {
    name: "Thread & Loom Works",
    city: "Tiruppur",
    country: "India",
    match: 91,
    capacity: "28,000 pcs / month",
    capabilities: ["T-shirts", "Embroidery", "Printing"],
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    verified: true,
    rating: "4.7",
  },
];

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

const requestRows = [
  { id: "RFQ-3481", product: "Organic cotton tees", quantity: "5,000 pcs", deadline: "Dec 18, 2026", status: "Quotations received", tone: "teal" },
  { id: "RFQ-3476", product: "Classic pique polos", quantity: "2,400 pcs", deadline: "Dec 29, 2026", status: "In review", tone: "blue" },
  { id: "RFQ-3469", product: "Relaxed-fit denim", quantity: "1,800 pcs", deadline: "Jan 08, 2027", status: "Matching", tone: "amber" },
  { id: "RFQ-3458", product: "Linen blend shirts", quantity: "3,200 pcs", deadline: "Jan 22, 2027", status: "Quotations received", tone: "teal" },
];

const quotationRows = [
  { factory: "Evergreen Apparel Ltd.", product: "Organic cotton tees", price: "$4.20 / unit", delivery: "35 days", status: "Best match", tone: "teal" },
  { factory: "Meridian Garments", product: "Classic pique polos", price: "$5.65 / unit", delivery: "42 days", status: "New quote", tone: "blue" },
  { factory: "Thread & Loom Works", product: "Linen blend shirts", price: "$8.10 / unit", delivery: "38 days", status: "Under review", tone: "amber" },
  { factory: "Sunrise Manufacturing", product: "Organic cotton tees", price: "$4.45 / unit", delivery: "32 days", status: "Shortlisted", tone: "violet" },
];

const buyerRequests = [
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
            <p><span className="location-pin">⌖</span> {factory.city}, {factory.country}</p>
          </div>
          <div className="match-chip"><Sparkles size={12} /> {factory.match}%</div>
        </div>
        <div className="factory-tags">{factory.capabilities.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="factory-card-meta">
          <span><Activity size={14} /> {factory.capacity}</span>
          <span><Star size={13} fill="currentColor" /> {factory.rating}</span>
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
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
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
  firstName,
}: {
  onNavigate: (label: string) => void;
  saved: string[];
  onToggleSave: (name: string) => void;
  onContact: (title: string) => void;
  firstName: string;
}) {
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
        <SectionHeading eyebrow="CURATED FOR YOUR BRAND" title="AI-recommended factories" description="Partners matched to your production needs and quality standards." action="Explore all factories" onAction={() => onNavigate("Find Factories")} />
        <div className="factory-card-grid">
          {factoryDirectory.slice(0, 3).map((factory) => (
            <FactoryCardView
              key={factory.name}
              factory={factory}
              saved={saved.includes(factory.name)}
              onSave={() => onToggleSave(factory.name)}
              onContact={() => onContact(factory.name)}
              onMessage={() => onContact(`Contact ${factory.name}`)}
            />
          ))}
        </div>
      </section>
      <div className="workspace-two-col">
        <section className="workspace-panel">
          <SectionHeading title="Recent production requests" action="View all" onAction={() => onNavigate("My Requests")} />
          <DataTable headers={["Request", "Quantity", "Deadline", "Status", ""]}>
            {requestRows.slice(0, 3).map((row) => (
              <tr key={row.id}>
                <td><strong className="table-main">{row.product}</strong><span className="table-sub">{row.id}</span></td>
                <td>{row.quantity}</td><td>{row.deadline}</td><td><StatusBadge tone={row.tone}>{row.status}</StatusBadge></td>
                <td><ActionButton onClick={() => onContact(row.id)}>Details</ActionButton></td>
              </tr>
            ))}
          </DataTable>
        </section>
        <section className="workspace-panel">
          <SectionHeading title="Recent quotations" action="Compare all" onAction={() => onNavigate("Received Quotations")} />
          <div className="quotation-list">
            {quotationRows.slice(0, 3).map((quote) => (
              <article className="quotation-item" key={quote.factory}>
                <span className="quote-avatar">{initials(quote.factory)}</span>
                <div className="quote-info"><strong>{quote.factory}</strong><span>{quote.product}</span><div><b>{quote.price}</b><span> · {quote.delivery}</span></div></div>
                <button className="quote-compare" onClick={() => onContact(`Quotation from ${quote.factory}`)}>Compare</button>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="workspace-panel buyer-order-panel">
        <SectionHeading title="Orders in progress" action="Track orders" onAction={() => onNavigate("My Orders")} />
        <div className="order-progress-grid">
          {orderRows.slice(0, 2).map((order) => (
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
  onContact,
  firstName,
}: {
  onNavigate: (label: string) => void;
  onContact: (title: string) => void;
  firstName: string;
}) {
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
          {buyerRequests.slice(0, 2).map((request) => (
            <article className="opportunity-item" key={request.id}>
              <div className="opportunity-top"><span className="match-chip"><Sparkles size={12} /> {request.match}% match</span><span className="request-time"><Clock3 size={12} /> 2h ago</span></div>
              <strong>{request.product}</strong>
              <span>{request.buyer} <i>·</i> {request.quantity}</span>
              <div className="opportunity-bottom"><span><CalendarDays size={13} /> Due {request.deadline}</span><button onClick={() => onContact(request.id)}>View request <ArrowRight size={13} /></button></div>
            </article>
          ))}
        </section>
      </div>
      <section className="workspace-panel">
        <SectionHeading title="New buyer requests" description="Recent opportunities looking for a manufacturing partner." action="View all requests" onAction={() => onNavigate("Production Requests")} />
        <BuyerRequestTable rows={buyerRequests.slice(0, 3)} onView={onContact} onQuote={onContact} />
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
  rows: typeof buyerRequests;
  onView: (title: string) => void;
  onQuote: (title: string) => void;
}) {
  return (
    <DataTable headers={["Request", "Buyer", "Quantity", "Deadline", "AI match", ""]}>
      {rows.map((request) => (
        <tr key={request.id}>
          <td><strong className="table-main">{request.product}</strong><span className="table-sub">{request.id}</span></td>
          <td>{request.buyer}</td><td>{request.quantity}</td><td>{request.deadline}</td>
          <td><span className="match-text"><Sparkles size={13} /> {request.match}%</span></td>
          <td className="table-actions-cell"><ActionButton onClick={() => onView(request.id)}>Details</ActionButton><ActionButton variant="primary" onClick={() => onQuote(`Send quotation for ${request.id}`)}>Quote</ActionButton></td>
        </tr>
      ))}
    </DataTable>
  );
}

function Marketplace({
  saved,
  onToggleSave,
  onContact,
}: {
  saved: string[];
  onToggleSave: (name: string) => void;
  onContact: (title: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Any location");
  const [category, setCategory] = useState("All categories");
  const [process, setProcess] = useState("All processes");
  const [capacity, setCapacity] = useState("Any capacity");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("Best match");
  const filtered = factoryDirectory.filter((factory) => {
    const text = `${factory.name} ${factory.city} ${factory.country} ${factory.capabilities.join(" ")}`.toLowerCase();
    const processText = process.toLowerCase();
    const processMatches = process === "All processes" || factory.capabilities.some((capability) => {
      const value = capability.toLowerCase();
      return value.includes(processText) ||
        (process === "Sewing" && value.includes("sew")) ||
        (process === "Cutting" && value.includes("cut")) ||
        (process === "Knitting" && value.includes("knit"));
    });
    const capacityValue = Number.parseInt(factory.capacity.replace(/\D/g, ""), 10);
    return text.includes(search.toLowerCase()) &&
      (location === "Any location" || factory.country === location) &&
      (category === "All categories" || factory.capabilities.join(" ").toLowerCase().includes(category.toLowerCase())) &&
      processMatches &&
      (capacity === "Any capacity" ||
        (capacity === "Under 30k" && capacityValue < 30000) ||
        (capacity === "30k–40k" && capacityValue >= 30000 && capacityValue <= 40000) ||
        (capacity === "40k+" && capacityValue > 40000)) &&
      (!verifiedOnly || factory.verified);
  }).sort((a, b) => sort === "Top rated" ? Number(b.rating) - Number(a.rating) : b.match - a.match);
  return (
    <>
      <SectionHeading eyebrow="DISCOVER YOUR NEXT PARTNER" title="Find the right factory" description="Explore verified manufacturing partners, matched to your standards." />
      <div className="market-search-panel">
        <label className="market-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search factory, capability or location..." /></label>
        <label className="market-select"><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>Any location</option><option>Bangladesh</option><option>Vietnam</option><option>India</option></select><ChevronDown size={14} /></label>
        <label className="market-select"><span>Product category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option><option>Knitwear</option><option>Denim</option><option>Printing</option><option>T-shirts</option><option>Organic cotton</option><option>Embroidery</option></select><ChevronDown size={14} /></label>
        <label className="market-select"><span>Process</span><select value={process} onChange={(event) => setProcess(event.target.value)}><option>All processes</option>{processOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></label>
        <label className="market-select"><span>Available capacity</span><select value={capacity} onChange={(event) => setCapacity(event.target.value)}><option>Any capacity</option><option>Under 30k</option><option>30k–40k</option><option>40k+</option></select><ChevronDown size={14} /></label>
        <button className={`verification-filter ${verifiedOnly ? "filter-selected" : ""}`} onClick={() => setVerifiedOnly((current) => !current)}><BadgeCheck size={15} /> Verified only</button>
      </div>
      <div className="market-results-line"><span><strong>{filtered.length} factories</strong> match your search</span><label><SlidersHorizontal size={14} /><span>Sort:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Best match</option><option>Top rated</option></select><ChevronDown size={13} /></label></div>
      {filtered.length > 0 ? (
        <div className="marketplace-grid">
          {filtered.map((factory) => <FactoryCardView key={factory.name} factory={factory} saved={saved.includes(factory.name)} onSave={() => onToggleSave(factory.name)} onContact={() => onContact(factory.name)} />)}
        </div>
      ) : <EmptyState title="No factories found" description="Try adjusting your search or filters to discover more partners." action="Clear filters" onAction={() => { setSearch(""); setLocation("Any location"); setCategory("All categories"); setProcess("All processes"); setCapacity("Any capacity"); setVerifiedOnly(false); }} />}
    </>
  );
}

function PostRequest({ onSubmitted }: { onSubmitted: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    onSubmitted();
  }
  return (
    <>
      <SectionHeading eyebrow="START A NEW PROJECT" title="Post a production request" description="Share your requirements and let the right factories come to you." />
      <form className="request-form workspace-panel" onSubmit={submit}>
        <div className="request-form-section"><span className="form-step-number">01</span><div><h3>Product details</h3><p>Tell us what you&apos;re looking to make.</p></div></div>
        <div className="request-form-grid">
          <label className="workspace-field"><span>Product name *</span><input required placeholder="e.g. Organic cotton crewneck tee" /></label>
          <label className="workspace-field"><span>Product category *</span><select required defaultValue=""><option value="" disabled>Select a category</option>{productOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="workspace-field"><span>Required quantity *</span><input required type="number" min="1" placeholder="e.g. 5,000" /></label>
          <label className="workspace-field"><span>Fabric type</span><select defaultValue=""><option value="" disabled>Select a fabric</option><option>Organic cotton jersey</option><option>French terry</option><option>Recycled polyester</option><option>Linen blend</option><option>Denim</option><option>Other</option></select></label>
          <label className="workspace-field"><span>Manufacturing process</span><select defaultValue=""><option value="" disabled>Select a process</option>{processOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="workspace-field"><span>Required delivery date *</span><input type="date" required /></label>
          <label className="workspace-field"><span>Target budget (per unit)</span><div className="input-prefix"><span>$</span><input type="number" min="0" placeholder="0.00" /></div></label>
          <label className="workspace-field"><span>Quality requirements</span><select defaultValue=""><option value="" disabled>Select a standard</option><option>Standard quality</option><option>Premium quality</option><option>GOTS certified</option><option>OEKO-TEX certified</option></select></label>
          <label className="workspace-field field-full"><span>Additional instructions</span><textarea rows={4} placeholder="Share sizing, packaging or other production details..." /></label>
          <label className="workspace-field field-full upload-field"><span>Reference images</span><span className="upload-drop"><Upload size={19} /><b>Click to upload</b> or drag and drop <small>PNG, JPG or PDF up to 10MB</small><input type="file" accept="image/*,.pdf" /></span></label>
        </div>
        {submitted && <div className="inline-success"><CheckCircle2 size={17} /> Request saved. AI matching is ready to find suitable factories.</div>}
        <div className="request-form-footer"><span><ShieldCheck size={15} /> Your designs and details are only shared with matched factories.</span><button type="submit" className="workspace-primary-button"><Sparkles size={16} /> Find matching factories with AI <ArrowRight size={15} /></button></div>
      </form>
    </>
  );
}

function BuyerRequestsPage({
  onContact,
  onNewRequest,
}: {
  onContact: (title: string) => void;
  onNewRequest: () => void;
}) {
  const [filter, setFilter] = useState("All requests");
  const rows = filter === "All requests" ? requestRows : requestRows.filter((request) => request.status === filter);
  return (
    <>
      <SectionHeading eyebrow="YOUR PRODUCTION PIPELINE" title="My requests" description="Track open production briefs and compare factory responses." action="New request" onAction={onNewRequest} />
      <div className="workspace-panel">
        <div className="table-toolbar"><div className="table-tabs">{["All requests", "Matching", "Quotations received", "In review"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="toolbar-filter"><Filter size={14} /> Filter</button></div>
        <DataTable headers={["Request", "Quantity", "Deadline", "Responses", "Status", ""]}>
          {rows.map((row, index) => <tr key={row.id}><td><strong className="table-main">{row.product}</strong><span className="table-sub">{row.id}</span></td><td>{row.quantity}</td><td>{row.deadline}</td><td>{[3, 0, 1, 5][index] ?? 2} factories</td><td><StatusBadge tone={row.tone}>{row.status}</StatusBadge></td><td><ActionButton onClick={() => onContact(row.id)}>Details</ActionButton></td></tr>)}
        </DataTable>
      </div>
    </>
  );
}

function BuyerQuotations({ onContact }: { onContact: (title: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("All quotes");
  const quotes = filter === "All quotes"
    ? quotationRows
    : filter === "New"
      ? quotationRows.filter((quote) => quote.status === "New quote")
      : quotationRows.filter((quote) => quote.status === "Shortlisted");
  return (
    <>
      <SectionHeading eyebrow="COMPARE YOUR OPTIONS" title="Received quotations" description="Review pricing, timelines and terms from your factory partners." />
      <div className="workspace-panel">
        <div className="table-toolbar"><div className="table-tabs">{["All quotes", "New", "Shortlisted"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}{item === "All quotes" && <span>24</span>}{item === "New" && <span>6</span>}</button>)}</div><button className="workspace-primary-button compact-button" disabled={selected.length < 2} onClick={() => onContact(`Compare ${selected.length} selected quotations`)}>Compare selected <ArrowRight size={14} /></button></div>
        <DataTable headers={["", "Factory", "Product", "Quoted price", "Delivery", "Status", ""]}>
          {quotes.map((quote) => <tr key={quote.factory}><td><input aria-label={`Select ${quote.factory} quotation`} type="checkbox" checked={selected.includes(quote.factory)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, quote.factory] : current.filter((name) => name !== quote.factory))} /></td><td><strong className="table-main">{quote.factory}</strong><span className="table-sub">Dhaka, Bangladesh <BadgeCheck size={11} /></span></td><td>{quote.product}</td><td><strong>{quote.price}</strong></td><td>{quote.delivery}</td><td><StatusBadge tone={quote.tone}>{quote.status}</StatusBadge></td><td><ActionButton onClick={() => onContact(`Quotation from ${quote.factory}`)}>Review</ActionButton></td></tr>)}
        </DataTable>
      </div>
    </>
  );
}

function OrdersPage({ factory = false, onContact }: { factory?: boolean; onContact: (title: string) => void }) {
  const [filter, setFilter] = useState("All orders");
  const rows = (factory ? orderRows : orderRows.map((row) => ({ ...row, buyer: row.buyer }))
  ).filter((row) => filter === "All orders" ||
    (filter === "In production" && row.status === "In production") ||
    (filter === "Ready to ship" && row.status === "Ready to ship") ||
    (filter === "Completed" && row.status === "Completed"));
  return (
    <>
      <SectionHeading eyebrow="PRODUCTION TRACKING" title={factory ? "Received orders" : "My orders"} description={factory ? "Keep every active production order on schedule." : "Follow your orders from production floor to delivery."} />
      <div className="workspace-stats compact-stats">
        <article className="workspace-stat-card"><span className="stat-label">Total orders</span><div className="stat-value-line"><strong>12</strong></div><span className="stat-card-note">All time</span></article>
        <article className="workspace-stat-card"><span className="stat-label">In production</span><div className="stat-value-line"><strong>07</strong></div><span className="stat-card-note">Across 4 factories</span></article>
        <article className="workspace-stat-card"><span className="stat-label">Ready to ship</span><div className="stat-value-line"><strong>02</strong></div><span className="stat-card-note">On schedule</span></article>
        <article className="workspace-stat-card"><span className="stat-label">Completed</span><div className="stat-value-line"><strong>03</strong></div><span className="stat-card-note">This quarter</span></article>
      </div>
      <div className="workspace-panel"><div className="table-toolbar"><div className="table-tabs">{["All orders", "In production", "Ready to ship", "Completed"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="toolbar-filter"><Filter size={14} /> Filter</button></div>
        <DataTable headers={["Order", factory ? "Buyer" : "Factory", "Product", "Quantity", "Delivery date", "Progress", "Status", ""]}>
          {rows.map((row) => <tr key={row.id}><td><strong className="table-main">{row.id}</strong></td><td>{factory ? row.buyer : ({ "ORD-2804": "Evergreen Apparel Ltd.", "ORD-2798": "Meridian Garments", "ORD-2786": "Thread & Loom Works", "ORD-2764": "Evergreen Apparel Ltd." }[row.id])}</td><td>{row.product}</td><td>{row.quantity}</td><td>{row.date}</td><td><div className="table-progress"><div><span style={{ width: `${row.progress}%` }} /></div>{row.progress}%</div></td><td><StatusBadge tone={row.tone}>{row.status}</StatusBadge></td><td><ActionButton onClick={() => onContact(row.id)}>Details</ActionButton></td></tr>)}
        </DataTable>
      </div>
    </>
  );
}

function FactoryRequests({ onContact }: { onContact: (title: string) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All opportunities");
  const rows = buyerRequests.filter((row) =>
    `${row.product} ${row.buyer} ${row.id}`.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All opportunities" ||
      (filter === "AI matched" && row.match >= 94) ||
      (filter === "Saved" && row.match >= 98)),
  );
  return (
    <>
      <SectionHeading eyebrow="FIND YOUR NEXT ORDER" title="Production requests" description="Buyer requests matched to your factory profile and available capacity." />
      <div className="workspace-panel">
        <div className="table-toolbar"><label className="table-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." /></label><div className="table-tabs">{["All opportunities", "AI matched", "Saved"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="toolbar-filter"><Filter size={14} /> Filter</button></div>
        <BuyerRequestTable rows={rows} onView={onContact} onQuote={onContact} />
      </div>
    </>
  );
}

function FactoryQuotations({ onContact }: { onContact: (title: string) => void }) {
  const [filter, setFilter] = useState("All quotations");
  const quotes = filter === "All quotations" ? quotationsFactory : quotationsFactory.filter((quote) => quote.status === filter);
  return (
    <>
      <SectionHeading eyebrow="YOUR ACTIVE OFFERS" title="My quotations" description="Track the quotes you have shared with prospective buyers." />
      <div className="workspace-panel">
        <div className="table-toolbar"><div className="table-tabs">{["All quotations", "Awaiting response", "Shortlisted", "Negotiating"].map((item) => <button className={filter === item ? "tab-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="toolbar-filter"><Filter size={14} /> Filter</button></div>
        <DataTable headers={["Buyer", "Product", "Quoted price", "Delivery time", "Sent", "Status", ""]}>
          {quotes.map((quote) => { const index = quotationsFactory.indexOf(quote); return <tr key={quote.buyer}><td><strong className="table-main">{quote.buyer}</strong><span className="table-sub">{["Copenhagen, Denmark", "Portland, USA", "London, UK"][index]}</span></td><td>{quote.product}</td><td><strong>{quote.price}</strong></td><td>{quote.delivery}</td><td>{["Nov 09", "Nov 07", "Nov 05"][index]}, 2026</td><td><StatusBadge tone={quote.tone}>{quote.status}</StatusBadge></td><td><ActionButton onClick={() => onContact(quote.buyer)}>Details</ActionButton></td></tr>; })}
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

function FactoryProfile({ onContact }: { onContact: (title: string) => void }) {
  return (
    <>
      <SectionHeading eyebrow="YOUR BUSINESS PRESENCE" title="Factory profile" description="A trusted, complete profile helps buyers discover the right manufacturing partner." action="Edit profile" onAction={() => onContact("Edit factory profile")} />
      <section className="workspace-panel profile-banner">
        <div className="profile-cover" />
        <div className="profile-main-info">
          <div className="factory-logo">EL<span>✦</span></div>
          <div className="profile-title"><div><h2>Evergreen Apparel Ltd. <BadgeCheck size={17} /></h2><p><span>⌖</span> Gazipur, Dhaka, Bangladesh <i>·</i> <span>Established 2012</span></p></div><StatusBadge tone="teal">Verified manufacturer</StatusBadge></div>
        </div>
        <p className="profile-description">A responsible, full-service apparel manufacturer specializing in quality knitwear and cut-and-sew production. We partner with purpose-driven brands to make better basics, thoughtfully.</p>
        <div className="profile-quick-stats"><span><strong>4.9</strong><small><Star size={12} fill="currentColor" /> 38 reviews</small></span><span><strong>120k</strong><small>Monthly capacity</small></span><span><strong>680</strong><small>Skilled workers</small></span><span><strong>12 yrs</strong><small>In business</small></span></div>
      </section>
      <div className="workspace-two-col">
        <section className="workspace-panel"><SectionHeading title="Manufacturing capabilities" action="Edit" onAction={() => onContact("Edit manufacturing capabilities")} /><h4 className="profile-subhead">Processes</h4><div className="factory-tags profile-tags">{processOptions.slice(0, 6).map((tag) => <span key={tag}>{tag}</span>)}</div><h4 className="profile-subhead">Product categories</h4><div className="factory-tags profile-tags">{["T-shirts", "Polo shirts", "Sweatshirts", "Hoodies", "Loungewear"].map((tag) => <span key={tag}>{tag}</span>)}</div><div className="profile-detail-list"><span>Machine information</span><b>86 industrial machines across 4 production lines</b><span>Certifications</span><b>GOTS · OEKO-TEX® · BSCI · WRAP</b></div></section>
        <section className="workspace-panel"><SectionHeading title="Contact information" action="Edit" onAction={() => onContact("Edit contact information")} /><div className="contact-detail"><Building2 size={16} /><span><b>Factory address</b><small>Plot 18, BSCIC Industrial Estate<br />Gazipur, Dhaka 1700, Bangladesh</small></span></div><div className="contact-detail"><Mail size={16} /><span><b>Business email</b><small>partnerships@evergreenapparel.example</small></span></div><div className="contact-detail"><MessageSquare size={16} /><span><b>Contact number</b><small>+880 1700 000 248</small></span></div><button className="outline-wide-button" onClick={() => onContact("Factory image gallery")}>View factory gallery <ArrowRight size={14} /></button></section>
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
}: {
  page: string;
  onContact: (title: string) => void;
  onNavigate: (label: string) => void;
  saved: string[];
  onToggleSave: (name: string) => void;
}) {
  if (page === "Find Factories") return null;
  if (page === "Post Production Request") return null;
  if (page === "My Requests") return <BuyerRequestsPage onContact={onContact} onNewRequest={() => onNavigate("Post Production Request")} />;
  if (page === "Received Quotations") return <BuyerQuotations onContact={onContact} />;
  if (page === "My Orders") return <OrdersPage onContact={onContact} />;
  if (page === "Saved Factories") {
    return (
      <>
        <SectionHeading eyebrow="YOUR SHORTLIST" title="Saved factories" description="Keep your favorite manufacturing partners close at hand." />
        {saved.length ? <div className="marketplace-grid">{factoryDirectory.filter((factory) => saved.includes(factory.name)).map((factory) => <FactoryCardView key={factory.name} factory={factory} saved onSave={() => onToggleSave(factory.name)} onContact={() => onContact(factory.name)} />)}</div> : <EmptyState title="No saved factories yet" description="Save a factory from the marketplace and it will appear here." action="Find factories" onAction={() => onNavigate("Find Factories")} />}
      </>
    );
  }
  return <UtilityPage page={page} onContact={onContact} />;
}

function FactoryGenericPage({ page, onContact }: { page: string; onContact: (title: string) => void }) {
  if (page === "Factory Profile") return <FactoryProfile onContact={onContact} />;
  if (page === "Available Capacity") return <CapacityManagement onContact={onContact} />;
  if (page === "Production Requests") return <FactoryRequests onContact={onContact} />;
  if (page === "Received Orders") return <OrdersPage factory onContact={onContact} />;
  if (page === "My Quotations") return <FactoryQuotations onContact={onContact} />;
  if (page === "Manufacturing Capabilities") return <CapabilitiesPage onContact={onContact} />;
  if (page === "Production Management") return <ProductionManagement onContact={onContact} />;
  return <UtilityPage page={page} onContact={onContact} />;
}

function CapabilitiesPage({ onContact }: { onContact: (title: string) => void }) {
  const [processes, setProcesses] = useState(["Cutting", "Sewing", "Knitting", "Printing", "Finishing"]);
  const [products, setProducts] = useState(["T-shirt", "Polo shirt", "Sweater", "Hoodie"]);
  function toggle(value: string, values: string[], update: (next: string[]) => void) {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }
  return (
    <>
      <SectionHeading eyebrow="SHOW WHAT YOU DO BEST" title="Manufacturing capabilities" description="Accurate capability details improve your AI matches and help buyers find the right partner." />
      <div className="workspace-panel capability-editor"><div className="request-form-section"><span className="form-step-number">01</span><div><h3>Processes &amp; expertise</h3><p>Select all processes available at your facility.</p></div></div><h4 className="profile-subhead">Manufacturing processes</h4><div className="selectable-chips">{processOptions.map((option) => <button className={processes.includes(option) ? "chip-selected" : ""} key={option} onClick={() => toggle(option, processes, setProcesses)}>{processes.includes(option) && <Check size={13} />}{option}</button>)}</div><h4 className="profile-subhead">Product categories</h4><div className="selectable-chips">{productOptions.map((option) => <button className={products.includes(option) ? "chip-selected" : ""} key={option} onClick={() => toggle(option, products, setProducts)}>{products.includes(option) && <Check size={13} />}{option}</button>)}</div><div className="request-form-grid capabilities-details"><label className="workspace-field"><span>Number of workers</span><input type="number" defaultValue="680" /></label><label className="workspace-field"><span>Production lines</span><input type="number" defaultValue="4" /></label><label className="workspace-field field-full"><span>Machine information</span><textarea rows={3} defaultValue="86 industrial sewing machines, 12 automatic cutting systems, 4 finishing lines." /></label></div><div className="request-form-footer"><span><ShieldCheck size={15} /> Your capabilities are shared on your public factory profile.</span><button className="workspace-primary-button" onClick={() => onContact("Manufacturing capabilities saved")}><Check size={15} /> Save capabilities</button></div></div>
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
  onLogout,
}: {
  role: DashboardRole;
  fullName: string;
  onLogout: () => void;
}) {
  const nav = role === "buyer" ? buyerNav : factoryNav;
  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([factoryDirectory[1].name]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dialog, setDialog] = useState("");
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteLeadTime, setQuoteLeadTime] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [logoutConfirmed, setLogoutConfirmed] = useState(false);

  const firstName = fullName.split(/\s+/)[0] || (role === "buyer" ? "Alex" : "Samira");
  const subtitle = role === "buyer" ? "BUYER WORKSPACE" : "FACTORY WORKSPACE";

  function openDialog(title: string) {
    setDialog(title);
    setQuotePrice("");
    setQuoteLeadTime("");
    setQuoteError("");
    setLogoutConfirmed(title === "Log out of your account?");
  }

  function handleDialogAction() {
    if (logoutConfirmed) {
      onLogout();
      return;
    }
    if (dialog.startsWith("Send quotation for ")) {
      if (!quotePrice.trim() || !quoteLeadTime.trim()) {
        setQuoteError("Add both a unit price and estimated lead time to continue.");
        return;
      }
      setDialog("Quotation sent");
      setQuoteError("");
      return;
    }
    setDialog("");
  }

  function navigate(label: string) {
    if (label === "Overview") setActivePage(label);
    else if (nav.some((item) => item.label === label)) setActivePage(label);
    else setDialog(label);
    setMobileOpen(false);
  }

  function toggleSave(name: string) {
    setSaved((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }

  function pageContent() {
    if (activePage === "Overview") {
      return role === "buyer"
        ? <BuyerOverview onNavigate={navigate} saved={saved} onToggleSave={toggleSave} onContact={openDialog} firstName={firstName} />
        : <FactoryOverview onNavigate={navigate} onContact={openDialog} firstName={firstName} />;
    }
    if (role === "buyer") {
      if (activePage === "Find Factories") return <Marketplace saved={saved} onToggleSave={toggleSave} onContact={openDialog} />;
      if (activePage === "Post Production Request") return <PostRequest onSubmitted={() => {}} />;
      return <BuyerGenericPage page={activePage} onContact={openDialog} onNavigate={navigate} saved={saved} onToggleSave={toggleSave} />;
    }
    return <FactoryGenericPage page={activePage} onContact={openDialog} />;
  }

  return (
    <div className={`dashboard-workspace ${role === "factory" ? "factory-workspace" : "buyer-workspace"}`}>
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`workspace-sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand-wrap"><DashboardBrand /><button className="sidebar-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
        <div className="workspace-switch"><span className={`workspace-switch-icon ${role}`}><BriefcaseBusiness size={16} /></span><span><b>{role === "buyer" ? "Northstar Studio" : "Evergreen Apparel"}</b><small>{subtitle}</small></span><ChevronDown size={15} /></div>
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
          <div className="sidebar-user"><span className="user-avatar">{initials(fullName || (role === "buyer" ? "Alex Morgan" : "Samira Rahman"))}</span><span><b>{fullName}</b><small>{role === "buyer" ? "Brand account" : "Factory administrator"}</small></span><MoreHorizontal size={17} /></div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>{role === "buyer" ? "Buyer" : "Factory"}</span><span>/</span><strong>{activePage}</strong></div>
          <div className="topbar-actions"><label className="top-search"><Search size={15} /><input placeholder="Search anything..." /><kbd>⌘ K</kbd></label><button className={`topbar-icon ${notificationOpen ? "topbar-icon-active" : ""}`} aria-label="Notifications" onClick={() => setNotificationOpen((current) => !current)}><Bell size={18} /><i /></button><span className="topbar-divider" /><button className="topbar-user" onClick={() => setDialog("Account profile")}><span className="user-avatar">{initials(fullName || "Alex Morgan")}</span><ChevronDown size={14} /></button></div>
          {notificationOpen && <div className="notification-popover"><div><strong>Notifications</strong><button onClick={() => setNotificationOpen(false)}><X size={14} /></button></div><p><span className="notification-dot" /><span><b>{role === "buyer" ? "New quotation received" : "New matching request"}</b><small>{role === "buyer" ? "Evergreen Apparel sent a quote · 12 min ago" : "Crewneck tee request matches your profile · 12 min ago"}</small></span></p><p><span className="notification-dot muted-dot" /><span><b>Order update</b><small>Production milestone completed · 2 hours ago</small></span></p><button className="notification-all" onClick={() => { setNotificationOpen(false); navigate("Messages"); }}>View all updates</button></div>}
        </header>
        <main className="workspace-content" key={activePage}>{pageContent()}</main>
        <footer className="workspace-footer"><span>© 2026 Threadline</span><span><a href="#help">Help center</a><a href="#privacy">Privacy</a><a href="#feedback">Send feedback</a></span></footer>
      </div>
      {dialog && (
        <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(""); }}>
          <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" aria-label="Close dialog" onClick={() => setDialog("")}><X size={17} /></button>
            <span className="modal-icon"><CheckCircle2 size={21} /></span>
            <h2 id="modal-title">{dialog}</h2>
            <p>
              {dialog === "Quotation sent"
                ? "Your quotation has been marked as sent in this demo. You can continue tracking it from My Quotations."
                : logoutConfirmed
                  ? "You will be signed out of your Threadline workspace."
                  : dialog.startsWith("Send quotation for ")
                    ? "Add your offer details to start a conversation with this buyer. This demo keeps the action local."
                    : dialog.includes("RFQ-")
                      ? "Request details, production specifications and buyer information will appear here."
                      : "This frontend demo records your selection locally. No information is sent to a server."}
            </p>
            {dialog.startsWith("Send quotation for ") && <div className="request-form-grid modal-quote-fields"><label className="workspace-field"><span>Price per unit</span><input value={quotePrice} onChange={(event) => setQuotePrice(event.target.value)} placeholder="$ 0.00" /></label><label className="workspace-field"><span>Lead time</span><input value={quoteLeadTime} onChange={(event) => setQuoteLeadTime(event.target.value)} placeholder="e.g. 35 days" /></label></div>}
            {quoteError && dialog.startsWith("Send quotation for ") && <p className="field-error" role="alert">{quoteError}</p>}
            <div className="modal-actions"><button className="cancel-button" onClick={() => setDialog("")}>{logoutConfirmed ? "Stay here" : "Close"}</button><button className="workspace-primary-button" onClick={handleDialogAction}>{logoutConfirmed ? "Log out" : dialog.startsWith("Send quotation for ") ? "Send quotation" : "Got it"}<ArrowRight size={14} /></button></div>
          </section>
        </div>
      )}
    </div>
  );
}
