import Link from "next/link";
import { ArrowRight, Factory, LogIn, Shirt, ShoppingBag, Sparkles, UserPlus } from "lucide-react";

export default function Home() {
  return (
    <main className="home-splash">
      {/* Top Navigation */}
      <header className="home-brand" style={{ position: "absolute", top: 28, left: 36, right: 36, display: "flex", justifyContent: "space-between", alignItems: "center", width: "calc(100% - 72px)" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#183348", fontSize: 20, fontWeight: 750 }}>
          <span><Shirt size={22} /></span>
          <span>GarmentConnect<span style={{ color: "#168a83" }}>.</span></span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid #d5dfdc",
              background: "#fff",
              color: "#183c50",
              fontSize: 14,
              fontWeight: 650,
              textDecoration: "none",
            }}
          >
            <LogIn size={15} /> Log in
          </Link>
          <Link
            href="/Register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 8,
              background: "#183c50",
              color: "#fff",
              fontSize: 14,
              fontWeight: 650,
              textDecoration: "none",
            }}
          >
            <UserPlus size={15} /> Register
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <div className="home-splash-copy">
        <span className="home-kicker">
          <Sparkles size={14} style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
          AI-POWERED GARMENT SOURCING
        </span>
        <h1>Better things are<br />made <em>together.</em></h1>
        <p>
          Connect global clothing brands and verified apparel manufacturers in one intelligent workspace.
          Manage RFQs, compare quotes, and track production floor milestones.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
          <Link className="home-start-button" href="/Register" style={{ margin: 0 }}>
            Create Account <ArrowRight size={17} />
          </Link>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              padding: "0 22px",
              borderRadius: 9,
              border: "1.5px solid #183c50",
              background: "#fff",
              color: "#183c50",
              fontSize: 15,
              fontWeight: 650,
              textDecoration: "none",
              transition: "transform 160ms ease",
            }}
          >
            Sign in to Dashboard <LogIn size={16} />
          </Link>
        </div>

        {/* Role Quick Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginTop: 36, textAlign: "left" }}>
          <Link
            href="/Register/buyer"
            style={{
              padding: "16px 18px",
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #e1e9e7",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#168a83", fontWeight: 700, fontSize: 13 }}>
              <ShoppingBag size={17} /> FOR BUYERS / BRANDS
            </div>
            <strong style={{ fontSize: 16, color: "#183348" }}>Source &amp; Order</strong>
            <small style={{ color: "#748493", fontSize: 13 }}>Post RFQs and discover verified garment factories.</small>
          </Link>

          <Link
            href="/Register/factory"
            style={{
              padding: "16px 18px",
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #e1e9e7",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a47d40", fontWeight: 700, fontSize: 13 }}>
              <Factory size={17} /> FOR FACTORIES
            </div>
            <strong style={{ fontSize: 16, color: "#183348" }}>Showcase &amp; Produce</strong>
            <small style={{ color: "#748493", fontSize: 13 }}>Share capacity and receive brand production orders.</small>
          </Link>
        </div>
      </div>

      <div className="home-bottom-note">GarmentConnect — Intelligent cloud manufacturing platform.</div>
    </main>
  );
}
