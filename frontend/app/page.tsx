"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Factory,
  Globe,
  Handshake,
  Layers,
  Leaf,
  LockKeyhole,
  Menu,
  PackageCheck,
  Rocket,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";

const factoryProfiles = [
  {
    name: "Demo apparel profile 01",
    city: "Faisalabad",
    country: "Pakistan",
    process: "Knitwear",
    categories: ["T-shirts", "Activewear"],
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Illustrative textile production equipment",
  },
  {
    name: "Demo apparel profile 02",
    city: "Dhaka",
    country: "Bangladesh",
    process: "Woven",
    categories: ["Shirts", "Uniforms"],
    image:
      "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Illustrative garment production workspace",
  },
  {
    name: "Demo apparel profile 03",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    process: "Denim",
    categories: ["Jeans", "Casualwear"],
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Illustrative apparel collection",
  },
];

const roleCards = [
  {
    title: "Garment Buyers & Brands",
    description:
      "Find manufacturing partners that fit your product, volume, and production requirements.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Clothing racks in a fashion studio",
    icon: ShoppingBag,
    id: "buyers",
    bullets: [
      "Discover manufacturing partners",
      "Post clear production requirements",
      "Compare quotations in one place",
      "Keep production conversations organized",
    ],
    href: "/Register/buyer",
    action: "Join as a buyer",
  },
  {
    title: "Manufacturing Factories",
    description:
      "Showcase your capabilities, share available capacity, and connect with new buyer opportunities.",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Workers collaborating in an industrial workspace",
    icon: Factory,
    id: "factories",
    bullets: [
      "Present your production capabilities",
      "Publish available capacity",
      "Receive relevant buyer requests",
      "Explore new production opportunities",
    ],
    href: "/Register/factory",
    action: "Join as a factory",
  },
  {
    title: "Sourcing Agents",
    description:
      "Coordinate supplier discovery and keep sourcing conversations moving with the right partners.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Sourcing professionals collaborating around a table",
    icon: BriefcaseBusiness,
    id: "agents",
    bullets: [
      "Discover manufacturing suppliers",
      "Coordinate sourcing activities",
      "Connect business partners",
      "Keep requirements easy to review",
    ],
    href: "/Register",
    action: "Explore the platform",
  },
  {
    title: "Fashion Startups",
    description:
      "Explore production options and find a practical path from an early idea to a production brief.",
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Fashion designer reviewing garment samples",
    icon: Rocket,
    id: "startups",
    bullets: [
      "Find suitable manufacturers",
      "Explore production options",
      "Prepare a clearer production brief",
      "Build lasting supplier relationships",
    ],
    href: "/Register/buyer",
    action: "Start as a buyer",
  },
];

const matchingCapabilities = [
  "Natural language understanding for production briefs",
  "Product details and quantity extraction",
  "Factory capability and process matching",
  "Available capacity considered alongside requirements",
  "Semantic similarity across buyer and factory profiles",
  "Ranked recommendations with understandable reasons",
];

const targetMarkets = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Netherlands",
  "Canada",
  "Australia",
  "Japan",
];

const marketPoints = [
  { country: "Canada", x: 21, y: 25 },
  { country: "United States", x: 22, y: 37 },
  { country: "United Kingdom", x: 49, y: 28 },
  { country: "Netherlands", x: 52, y: 30 },
  { country: "Germany", x: 54, y: 33 },
  { country: "France", x: 51, y: 36 },
  { country: "Italy", x: 55, y: 40 },
  { country: "Japan", x: 83, y: 42 },
  { country: "Australia", x: 82, y: 75 },
];

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      className={`market-brand${inverse ? " market-brand-inverse" : ""}`}
      href="/"
      aria-label="GarmentConnect home"
    >
      <span className="market-brand-icon"><Shirt size={19} strokeWidth={2.2} /></span>
      <span>GarmentConnect<span className="market-brand-period">.</span></span>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`market-section-heading${centered ? " is-centered" : ""}${light ? " is-light" : ""}`}>
      <span className="market-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function FactoryCard({
  profile,
}: {
  profile: (typeof factoryProfiles)[number];
}) {
  return (
    <article className="market-factory-card">
      <div
        className="market-factory-image"
        role="img"
        aria-label={profile.imageAlt}
        style={{ backgroundImage: `url("${profile.image}")` }}
      >
        <span className="market-demo-tag">Demo profile</span>
      </div>
      <div className="market-factory-body">
        <div className="market-factory-heading">
          <div className="market-factory-avatar"><Factory size={19} /></div>
          <div>
            <h3>{profile.name}</h3>
            <p><Globe size={13} /> {profile.city}, {profile.country}</p>
          </div>
        </div>
        <div className="market-factory-tags">
          <span>{profile.process}</span>
          {profile.categories.map((category) => <span key={category}>{category}</span>)}
        </div>
        <div className="market-factory-status">
          <span className="market-status-dot" />
          Illustrative profile · Not verified
        </div>
        <details className="market-factory-details">
          <summary className="market-text-button">View Factory Profile <ArrowUpRight size={15} /></summary>
          <p>Illustrative demo information only. No real company, partnership, certification, or verification is represented.</p>
        </details>
      </div>
    </article>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [country, setCountry] = useState("all");
  const [process, setProcess] = useState("all");
  const [category, setCategory] = useState("all");
  const [verification, setVerification] = useState("all");

  const visibleFactories = factoryProfiles.filter((profile) => {
    const matchesCountry = country === "all" || profile.country === country;
    const matchesProcess = process === "all" || profile.process === process;
    const matchesCategory = category === "all" || profile.categories.includes(category);
    const matchesVerification = verification !== "verified";
    return matchesCountry && matchesProcess && matchesCategory && matchesVerification;
  });

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="market-page">
      <a className="market-skip-link" href="#main-content">Skip to content</a>
      <header className="market-header">
        <div className="market-header-inner">
          <BrandMark />
          <button
            className="market-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav
            id="primary-navigation"
            className={`market-nav${menuOpen ? " is-open" : ""}`}
            aria-label="Main navigation"
          >
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#about" onClick={closeMenu}>About Us</a>
            <a href="#buyers" onClick={closeMenu}>For Buyers</a>
            <a href="#factories" onClick={closeMenu}>For Factories</a>
            <a href="#partners" onClick={closeMenu}>Manufacturing Partners</a>
          </nav>
          <div className="market-header-actions">
            <Link className="market-login-link" href="/login">Login</Link>
            <Link className="market-button market-button-small" href="/Register">
              Get Started <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <div id="main-content">
        <section className="market-hero" id="home">
          <div className="market-shell market-hero-grid">
            <div className="market-hero-copy">
              <span className="market-hero-kicker"><span /> THE GARMENT INDUSTRY, CONNECTED</span>
              <h1>Connect Buyers.<br />Empower Factories.<br /><span>Optimize Production.</span></h1>
              <p className="market-hero-description">
                An AI-powered manufacturing marketplace connecting garment buyers with trusted factories while unlocking unused production capacity.
              </p>
              <div className="market-hero-actions">
                <Link className="market-button" href="/Register/buyer">
                  Join as Buyer <ArrowRight size={17} />
                </Link>
                <Link className="market-button market-button-outline" href="/Register/factory">
                  Join as Factory <Factory size={17} />
                </Link>
              </div>
              <div className="market-hero-highlights" aria-label="Platform focus areas">
                <span><Sparkles size={16} /> AI-powered factory matching</span>
                <span><Layers size={16} /> Smart capacity sharing</span>
                <span><Handshake size={16} /> Manufacturing partnerships</span>
              </div>
            </div>
            <div className="market-hero-visual">
              <div
                className="market-hero-photo"
                role="img"
                aria-label="Illustrative garment production floor"
              />
              <div className="market-photo-caption">
                <span className="market-caption-mark"><Factory size={17} /></span>
                <span><b>Built for the people who make apparel</b><small>From sourcing brief to production opportunity</small></span>
              </div>
              <div className="market-hero-float-card">
                <span className="market-float-icon"><Workflow size={17} /></span>
                <span><b>A clearer path to production</b><small>Requirements meet capabilities</small></span>
                <CheckCircle2 size={18} className="market-float-check" />
              </div>
              <span className="market-visual-index">01 <i /> INDUSTRY CONNECTIONS</span>
            </div>
          </div>
          <div className="market-hero-bottom-rule" />
        </section>

        <section className="market-problem-section market-section" id="about">
          <div className="market-shell">
            <SectionHeading
              eyebrow="A BETTER WAY TO SOURCE"
              title="A Smarter Way to Connect the Garment Industry"
              description="GarmentConnect brings buyers and manufacturing companies into one B2B marketplace, with AI-powered recommendations designed to make discovery more relevant."
              centered
            />
            <div className="market-challenge-grid">
              <article className="market-challenge-card">
                <span className="market-challenge-number">01</span>
                <div className="market-challenge-icon"><Search size={20} /></div>
                <h3>Factory discovery takes time</h3>
                <p>Finding a manufacturer with the right process, product experience, and production fit can mean searching across disconnected channels.</p>
              </article>
              <article className="market-challenge-card">
                <span className="market-challenge-number">02</span>
                <div className="market-challenge-icon"><Layers size={20} /></div>
                <h3>Unused capacity is hard to surface</h3>
                <p>Available production windows can go unnoticed when factories have no clear way to share capacity with potential buyers.</p>
              </article>
              <article className="market-challenge-card">
                <span className="market-challenge-number">03</span>
                <div className="market-challenge-icon"><Workflow size={20} /></div>
                <h3>Manual matching slows momentum</h3>
                <p>Scattered requirements and capability details make it harder for both sides to evaluate a good-fit opportunity.</p>
              </article>
            </div>
            <div className="market-solution-strip">
              <span className="market-solution-icon"><Sparkles size={20} /></span>
              <div><b>One connected marketplace. More informed introductions.</b><p>Bring production requirements, factory capabilities, and capacity information into a clearer discovery workflow.</p></div>
              <a href="#ai">See how matching is designed <ArrowRight size={15} /></a>
            </div>
          </div>
        </section>

        <section className="market-audience-section market-section" aria-labelledby="audience-heading">
          <div className="market-shell">
            <div className="market-audience-intro">
              <div>
                <span className="market-eyebrow">ONE NETWORK, MANY ROLES</span>
                <h2 id="audience-heading">Who Benefits From<br />Our Platform?</h2>
              </div>
              <p>Whether you are developing a product, sourcing a supplier, or filling a production schedule, GarmentConnect is designed to help the right conversations start.</p>
            </div>
            <div className="market-role-grid">
              {roleCards.map((role) => {
                const Icon = role.icon;
                return (
                  <article className="market-role-card" id={role.id} key={role.id}>
                    <div
                      className="market-role-image"
                      role="img"
                      aria-label={role.imageAlt}
                      style={{ backgroundImage: `url("${role.image}")` }}
                    >
                      <span className="market-role-icon"><Icon size={19} /></span>
                    </div>
                    <div className="market-role-content">
                      <h3>{role.title}</h3>
                      <p>{role.description}</p>
                      <ul>
                        {role.bullets.map((bullet) => <li key={bullet}><Check size={14} />{bullet}</li>)}
                      </ul>
                      <Link href={role.href} className="market-card-link">
                        {role.action} <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="market-ai-section market-section" id="ai">
          <div className="market-shell market-ai-grid">
            <div className="market-ai-copy">
              <span className="market-eyebrow market-eyebrow-light"><BrainCircuit size={15} /> INTELLIGENT DISCOVERY</span>
              <h2>Smart Matching<br />Powered by AI</h2>
              <p className="market-ai-lead">Turn a production brief into a more useful starting point for factory discovery.</p>
              <p className="market-ai-disclaimer">AI matching is a product capability direction. Recommendations should support—not replace—human review, and availability depends on implemented platform features.</p>
              <ul className="market-ai-list">
                {matchingCapabilities.map((capability) => (
                  <li key={capability}><CheckCircle2 size={17} />{capability}</li>
                ))}
              </ul>
            </div>
            <div className="market-match-visual">
              <div className="market-match-heading">
                <span className="market-match-icon"><Sparkles size={18} /></span>
                <div><b>Matching journey</b><small>Illustrative concept · Not live analysis</small></div>
                <span className="market-concept-tag">CONCEPT</span>
              </div>
              <div className="market-match-request">
                <span className="market-match-label"><ShoppingBag size={14} /> BUYER PRODUCTION BRIEF</span>
                <h3>Organic cotton jersey T-shirts</h3>
                <div className="market-brief-chips"><span>5,000 units</span><span>Cut &amp; sew</span><span>Sizes S–XL</span></div>
                <p>Illustrative example of the details a buyer might include in a request.</p>
              </div>
              <div className="market-match-connector"><span /><i /><span /></div>
              <div className="market-match-results">
                <div className="market-results-title"><b>Potential profile fit</b><small>Example only</small></div>
                <div className="market-result-row">
                  <span className="market-result-icon"><Factory size={16} /></span>
                  <div><b>Demo knitwear profile</b><small>Process and product category overlap</small></div>
                  <ArrowUpRight size={16} />
                </div>
                <div className="market-result-row">
                  <span className="market-result-icon result-icon-blue"><Factory size={16} /></span>
                  <div><b>Demo apparel profile</b><small>Capacity details would need review</small></div>
                  <ArrowUpRight size={16} />
                </div>
                <div className="market-result-note"><ShieldCheck size={15} /> Review requirements and factory details before making a decision.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="market-partners-section market-section" id="partners">
          <div className="market-shell">
            <div className="market-partners-heading">
              <SectionHeading
                eyebrow="PARTNER DIRECTORY PREVIEW"
                title="Explore Manufacturing Partners"
                description="Browse illustrative demo profiles to see how manufacturing capabilities could be presented. These are not real partner listings."
              />
              <Link className="market-button market-button-outline" href="/Register">
                Join the marketplace <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="market-filters" aria-label="Filter demo factory profiles">
              <label>
                <span>Country</span>
                <select value={country} onChange={(event) => setCountry(event.target.value)}>
                  <option value="all">All countries</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="Vietnam">Vietnam</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
              <label>
                <span>Manufacturing process</span>
                <select value={process} onChange={(event) => setProcess(event.target.value)}>
                  <option value="all">All processes</option>
                  <option value="Knitwear">Knitwear</option>
                  <option value="Woven">Woven</option>
                  <option value="Denim">Denim</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
              <label>
                <span>Product category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="all">All categories</option>
                  <option value="T-shirts">T-shirts</option>
                  <option value="Activewear">Activewear</option>
                  <option value="Shirts">Shirts</option>
                  <option value="Uniforms">Uniforms</option>
                  <option value="Jeans">Jeans</option>
                  <option value="Casualwear">Casualwear</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
              <label>
                <span>Verification status</span>
                <select value={verification} onChange={(event) => setVerification(event.target.value)}>
                  <option value="all">All demo profiles</option>
                  <option value="demo">Demo / not verified</option>
                  <option value="verified">Verified partners</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
            </div>
            <p className="market-demo-notice"><ShieldCheck size={15} /> Demo profiles and stock imagery only. No real companies, partnerships, or certifications are represented.</p>
            {visibleFactories.length > 0 ? (
              <div className="market-factory-grid">
                {visibleFactories.map((profile) => <FactoryCard key={profile.name} profile={profile} />)}
              </div>
            ) : (
              <div className="market-empty-state">
                <Search size={21} />
                <div><b>No profiles match these filters.</b><p>There are currently no verified partner profiles in this preview.</p></div>
                <button type="button" onClick={() => { setCountry("all"); setProcess("all"); setCategory("all"); setVerification("all"); }}>Clear filters</button>
              </div>
            )}
          </div>
        </section>

        <section className="market-global-section market-section">
          <div className="market-shell market-global-grid">
            <div className="market-global-copy">
              <span className="market-eyebrow">A GLOBAL OUTLOOK</span>
              <h2>Connecting Manufacturing with Global Markets</h2>
              <p>GarmentConnect is designed to make it easier for clothing brands and manufacturing partners to find one another across borders.</p>
              <div className="market-country-status">
                <span className="market-status-indicator" />
                <div><b>Active buyer countries</b><small>No live registered-buyer country data is available to display yet.</small></div>
              </div>
              <div className="market-target-list">
                <div className="market-target-title"><Globe size={16} /><b>Target markets</b><span>Illustrative, not active customers</span></div>
                <div className="market-target-chips">
                  {targetMarkets.map((market) => <span key={market}>{market}</span>)}
                </div>
              </div>
            </div>
            <div className="market-map-panel">
              <div className="market-map-label"><span className="market-map-dot" /> Illustrative target markets</div>
              <div className="market-map" role="img" aria-label={`Illustrative map of target markets: ${targetMarkets.join(", ")}. No active buyer countries are shown.`}>
                <svg viewBox="0 0 900 440" aria-hidden="true">
                  <path d="M93 107 135 77 191 80 218 101 258 104 276 124 263 145 241 151 234 175 211 184 197 207 174 208 160 193 142 184 133 161 113 150 102 130Z" />
                  <path d="m209 212 24 6 19 24 14 31-4 38-17 42-16 31-12-10-4-31-13-25-3-31-12-23 5-24Z" />
                  <path d="m389 95 33-15 51 3 35 14 42-1 35 17 44-1 36 15 34-1 24 15-12 17-44 2-28 15-30-4-25 16-33-4-24 13-27-9-24 9-22-13-27 4-25-18-28-4-19-19 8-20Z" />
                  <path d="m431 174 27 2 22 17 18 31-8 39-16 35-20 23-19-5-14-26-10-35-9-34 7-30Z" />
                  <path d="m648 211 37-19 47 7 28 18 39 5 24 20-8 18-34 2-21 17-38-5-31 13-38-12-24-19 6-24Z" />
                  <path d="m705 297 30-10 34 8 25 21-12 20-31 10-30-9-24-18Z" />
                  <path d="m810 210 14-7 12 9-2 17-13 7-13-11Z" />
                  <path d="m767 369 22-10 25 7 11 15-16 13-27-3-18-10Z" />
                  {marketPoints.map((point) => (
                    <g key={point.country} transform={`translate(${point.x * 9}, ${point.y * 4.4})`}>
                      <circle className="market-map-point-ring" r="8" />
                      <circle className="market-map-point" r="3.2" />
                    </g>
                  ))}
                </svg>
                <div className="market-map-caption">Target markets only · No live buyer locations shown</div>
              </div>
            </div>
          </div>
        </section>

        <section className="market-advantages-section market-section">
          <div className="market-shell">
            <SectionHeading
              eyebrow="WHY GARMENTCONNECT"
              title="Better Connections Create Better Opportunities"
              description="A more considered sourcing workflow can help buyers and factories spend less time searching and more time evaluating the right opportunity."
              centered
            />
            <div className="market-advantage-grid">
              <article className="market-advantage-card"><span><BrainCircuit size={21} /></span><h3>AI-Powered Matching</h3><p>Discover factories based on manufacturing requirements, product needs, and stated capabilities.</p></article>
              <article className="market-advantage-card"><span><Layers size={21} /></span><h3>Capacity Sharing</h3><p>Help factories surface available production capacity and connect with potential new work.</p></article>
              <article className="market-advantage-card"><span><ClipboardCheck size={21} /></span><h3>Efficient Sourcing</h3><p>Organize production requirements and make quotation comparisons easier to navigate.</p></article>
              <article className="market-advantage-card"><span><Handshake size={21} /></span><h3>Business Connectivity</h3><p>Create a clearer starting point for buyers and manufacturers to build working relationships.</p></article>
            </div>
          </div>
        </section>

        <section className="market-trust-section market-section">
          <div className="market-shell market-trust-grid">
            <div className="market-trust-copy">
              <span className="market-eyebrow">BUILT ON CLARITY</span>
              <h2>Trust grows when information is transparent.</h2>
              <p>Good introductions start with accurate profiles and clear expectations. The marketplace is designed to keep important details visible and decisions grounded in human review.</p>
              <Link className="market-text-button market-trust-link" href="/Register">
                Be part of a clearer supply chain <ArrowRight size={15} />
              </Link>
            </div>
            <div className="market-trust-list">
              <div><span><ShieldCheck size={18} /></span><p><b>Factory profile verification</b><small>Verification status should be clear and based on review—not assumed.</small></p></div>
              <div><span><ClipboardCheck size={18} /></span><p><b>Transparent manufacturing information</b><small>Profiles can communicate processes, categories, and stated capacity.</small></p></div>
              <div><span><PackageCheck size={18} /></span><p><b>Clear production requirements</b><small>Structured briefs help both sides understand what is being requested.</small></p></div>
              <div><span><LockKeyhole size={18} /></span><p><b>Secure user accounts</b><small>Account access is managed through the platform&apos;s authentication flow.</small></p></div>
              <div><span><Users size={18} /></span><p><b>Human review of recommendations</b><small>AI suggestions are decision support, not a substitute for due diligence.</small></p></div>
            </div>
          </div>
        </section>

        <section className="market-cta-section">
          <div className="market-shell market-cta-inner">
            <div className="market-cta-icon"><Leaf size={22} /></div>
            <span className="market-eyebrow market-eyebrow-light">LET&apos;S MAKE THE CONNECTION</span>
            <h2>Ready to Build Better<br />Manufacturing Partnerships?</h2>
            <p>Join GarmentConnect and discover a smarter way to connect buyers and factories.</p>
            <div className="market-cta-actions">
              <Link className="market-button market-button-white" href="/Register/buyer">Register as Buyer <ArrowRight size={16} /></Link>
              <Link className="market-button market-button-dark-outline" href="/Register/factory">Register as Factory <Factory size={16} /></Link>
            </div>
          </div>
        </section>
      </div>

      <footer className="market-footer" id="footer">
        <div className="market-shell">
          <div className="market-footer-main">
            <div className="market-footer-brand">
              <BrandMark inverse />
              <p>AI-powered garment manufacturing capacity sharing and buyer–factory matching.</p>
              <span className="market-footer-tagline">Connect Buyers. Empower Factories. Optimize Production.</span>
            </div>
            <div className="market-footer-column">
              <h3>Quick Links</h3>
              <a href="#home">Home</a>
              <a href="#about">About Us</a>
              <a href="#partners">Manufacturing Partners</a>
              <a href="#ai">AI Matching</a>
            </div>
            <div className="market-footer-column">
              <h3>For Buyers</h3>
              <a href="#buyers">Buyer benefits</a>
              <Link href="/Register/buyer">Register as Buyer</Link>
              <Link href="/login">Login</Link>
            </div>
            <div className="market-footer-column">
              <h3>For Factories</h3>
              <a href="#factories">Factory benefits</a>
              <Link href="/Register/factory">Register as Factory</Link>
              <a href="#partners">Explore profiles</a>
            </div>
            <div className="market-footer-column market-footer-contact">
              <h3>Contact</h3>
              <p>Contact details will be published here as the marketplace launches.</p>
              <Link href="/Register">Get in touch through your account <ArrowUpRight size={13} /></Link>
            </div>
          </div>
          <div className="market-footer-legal">
            <span>© 2026 GarmentConnect. All rights reserved.</span>
            <div><a href="#legal-note">Privacy Policy</a><a href="#legal-note">Terms of Service</a></div>
            <span id="legal-note">Privacy and terms documentation will be published before public launch.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
