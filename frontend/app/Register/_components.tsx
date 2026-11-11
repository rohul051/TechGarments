"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Factory,
  Shirt,
  Sparkles,
} from "lucide-react";

export function Brand() {
  return (
    <Link className="brand-lockup" href="/Register" aria-label="Threadline home">
      <span className="brand-mark"><Shirt size={19} strokeWidth={1.9} /></span>
      <span className="brand-name">threadline<span>.</span></span>
    </Link>
  );
}

export function RegisterNav() {
  return (
    <header className="register-nav">
      <Brand />
      <nav className="nav-links" aria-label="Main navigation">
        <Link href="/">Home</Link>
        <a href="/Register#about">About</a>
        <a href="/Register#how-it-works">How it works</a>
      </nav>
      <div className="nav-actions">
        <Link className="nav-login" href="/login">Log in</Link>
        <Link className="nav-cta" href="/Register">
          Get started <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

export function RegisterFooter() {
  return (
    <footer className="register-footer" id="about">
      <Brand />
      <p>Making better connections in garment manufacturing.</p>
      <nav aria-label="Footer navigation">
        <a href="/Register#about">About</a>
        <a href="mailto:hello@threadline.example">Contact</a>
        <a href="/Register#privacy">Privacy</a>
        <a href="/Register#terms">Terms</a>
      </nav>
      <span className="copyright">© 2025 Threadline</span>
    </footer>
  );
}

export function TextileIllustration({ factory = false }: { factory?: boolean }) {
  return (
    <div className={`textile-art ${factory ? "textile-art-factory" : ""}`}>
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-dots" />
      <div className="art-fabric">
        <div className="fabric-fold fold-one" />
        <div className="fabric-fold fold-two" />
        <div className="fabric-stitch" />
      </div>
      <div className="art-thread thread-one" />
      <div className="art-thread thread-two" />
      <div className="art-tag">
        <span className="tag-seal"><Sparkles size={14} /></span>
        <span><b>Made with purpose</b><small>Better things, together.</small></span>
      </div>
      <div className="art-badge">
        {factory ? <Factory size={15} /> : <Shirt size={15} />}
        <span>{factory ? "Factory network" : "The maker network"}</span>
        <span className="badge-check"><Check size={11} /></span>
      </div>
    </div>
  );
}

export function FormShell({
  children,
  title,
  description,
  factory = false,
  step,
  steps,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  factory?: boolean;
  step?: number;
  steps?: string[];
}) {
  return (
    <main className="registration-layout">
      <section className={`form-aside ${factory ? "form-aside-factory" : ""}`}>
        <RegisterNav />
        <div className="aside-content">
          <Link className="back-link" href="/Register">
            <ArrowLeft size={15} /> All account types
          </Link>
          <div className="aside-heading">
            <span className="aside-overline">
              {factory ? "MADE FOR THE MAKERS" : "MADE FOR THE VISIONARIES"}
            </span>
            <h2>
              {factory ? "Your craft deserves a bigger stage." : "Bring your next big idea to life."}
            </h2>
            <p>
              {factory
                ? "Meet the brands looking for exactly what you do best."
                : "Find a manufacturing partner who sees your vision."}
            </p>
          </div>
          <TextileIllustration factory={factory} />
          <div className="aside-footnote">
            <span className="online-dot" />
            <span>Good things are made together.</span>
          </div>
        </div>
      </section>
      <section className="form-main">
        <div className="mobile-form-brand"><Brand /></div>
        <div className="form-panel">
          <div className="form-heading">
            <span className="form-eyebrow">
              {factory ? "FACTORY PARTNER" : "BUYER ACCOUNT"}
            </span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {step !== undefined && steps && (
            <div className="step-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
              <div className="step-track">
                {steps.map((label, index) => (
                  <div
                    className={`step-item ${index <= step ? "step-active" : ""} ${index < step ? "step-complete" : ""}`}
                    key={label}
                  >
                    <span className="step-dot">
                      {index < step ? <Check size={13} /> : index + 1}
                    </span>
                    <span className="step-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {children}
        </div>
        <div className="form-mobile-footer">Secure registration <span>·</span> Free to join</div>
      </section>
    </main>
  );
}

export function FormSectionTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="form-section-title">
      <span>{number}</span>
      <h2>{title}</h2>
      <div />
    </div>
  );
}

export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  icon,
  required = true,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  icon?: React.ReactNode;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="form-field" htmlFor={id}>
      <span className="field-label">{label}{required && <span className="required-mark"> *</span>}</span>
      <span className="field-control">
        {icon && <span className="field-icon">{icon}</span>}
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
      </span>
    </label>
  );
}

export function SelectField({
  id,
  label,
  options,
  placeholder = "Select an option",
  required = true,
}: {
  id: string;
  label: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="form-field" htmlFor={id}>
      <span className="field-label">{label}{required && <span className="required-mark"> *</span>}</span>
      <span className="field-control select-control">
        <select id={id} name={id} required={required} defaultValue="">
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown className="select-chevron" size={16} aria-hidden="true" />
      </span>
    </label>
  );
}

export function PasswordField({ id, label }: { id: string; label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-field">
      <label className="field-label" htmlFor={id}>{label}<span className="required-mark"> *</span></label>
      <span className="field-control">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          placeholder="At least 8 characters"
          minLength={8}
          autoComplete={id === "password" ? "new-password" : "new-password"}
          required
        />
        <button
          className="password-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </div>
  );
}

export function TermsCheckbox() {
  return (
    <label className="terms-control">
      <input type="checkbox" name="terms" required />
      <span className="custom-checkbox"><Check size={12} /></span>
      <span>
        I agree to the <a href="/Register#terms">Terms of Service</a> and{" "}
        <a href="/Register#privacy">Privacy Policy</a>
      </span>
    </label>
  );
}

export function SubmitMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="success-message" role="status">
      <span className="success-icon"><Check size={17} /></span>
      <span>{children}</span>
    </div>
  );
}

export function FormSubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="form-submit" type="submit">
      {children}<ArrowRight size={17} aria-hidden="true" />
    </button>
  );
}
