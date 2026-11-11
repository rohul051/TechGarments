import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Factory,
  Shirt,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { RegisterFooter, RegisterNav } from "./_components";

const buyerBenefits = [
  "Discover manufacturing partners",
  "Post production requirements",
  "Compare factory quotations",
];

const factoryBenefits = [
  "Showcase factory capabilities",
  "Publish available production capacity",
  "Receive production requests",
];

export default function RegisterPage() {
  return (
    <main className="register-page">
      <RegisterNav />
      <section className="register-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            A better way to make what&apos;s next
          </div>
          <h1>
            Join the future of
            <br />
            <span>garment manufacturing.</span>
          </h1>
          <p>
            Connect with trusted manufacturing partners, discover production
            opportunities, and grow your business with AI-powered matching.
          </p>
        </div>

        <div className="role-cards" aria-label="Choose your account type">
          <article className="role-card buyer-card">
            <div className="role-icon buyer-icon">
              <ShoppingBag size={25} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <span className="role-kicker">For brands &amp; retailers</span>
            <h2>Buyer / Brand</h2>
            <p>
              Find verified garment factories, request quotations, and turn
              your clothing ideas into reality.
            </p>
            <ul>
              {buyerBenefits.map((benefit) => (
                <li key={benefit}>
                  <Check size={16} aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
            <Link className="role-button buyer-button" href="/Register/buyer">
              Continue as Buyer <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <span className="role-number">01</span>
          </article>

          <article className="role-card factory-card">
            <div className="role-icon factory-icon">
              <Factory size={25} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <span className="role-kicker">For makers &amp; manufacturers</span>
            <h2>Company / Factory</h2>
            <p>
              Showcase your manufacturing capabilities, share available
              capacity, and receive new business opportunities.
            </p>
            <ul>
              {factoryBenefits.map((benefit) => (
                <li key={benefit}>
                  <Check size={16} aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
            <Link
              className="role-button factory-button"
              href="/Register/factory"
            >
              Continue as Factory <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <span className="role-number">02</span>
          </article>
        </div>

        <div className="trust-note">
          <BadgeCheck size={17} aria-hidden="true" />
          <span>
            Built for a more connected industry
            <span className="trust-divider">·</span>
            Your business details stay private
          </span>
        </div>
      </section>

      <section className="network-strip" id="how-it-works">
        <div className="network-intro">
          <span className="section-label">MADE FOR THE WHOLE INDUSTRY</span>
          <h2>From first idea to final stitch.</h2>
        </div>
        <div className="network-stat">
          <span className="stat-icon"><Shirt size={19} aria-hidden="true" /></span>
          <span><strong>One network</strong><small>Brands and makers, together</small></span>
        </div>
        <div className="network-stat">
          <span className="stat-icon stat-icon-teal"><Sparkles size={19} aria-hidden="true" /></span>
          <span><strong>Smarter matching</strong><small>The right partner for every order</small></span>
        </div>
        <div className="network-stat">
          <span className="stat-icon stat-icon-gold"><Building2 size={19} aria-hidden="true" /></span>
          <span><strong>Built on trust</strong><small>Business made more transparent</small></span>
        </div>
      </section>

      <RegisterFooter />
    </main>
  );
}
