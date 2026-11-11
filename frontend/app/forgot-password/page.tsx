"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Shirt } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  return (
    <main className="forgot-experience">
      <header className="forgot-header">
        <Link className="login-brand" href="/" aria-label="GarmentConnect home">
          <span className="login-brand-mark"><Shirt size={18} /></span>
          <span>GarmentConnect<span className="login-brand-dot">.</span></span>
        </Link>
        <Link className="forgot-back-top" href="/login"><ArrowLeft size={15} /> Back to login</Link>
      </header>
      <section className="forgot-card">
        <span className={`forgot-icon ${submitted ? "forgot-icon-success" : ""}`}>
          {submitted ? <CheckCircle2 size={24} /> : <Mail size={23} />}
        </span>
        {submitted ? (
          <>
            <span className="login-form-eyebrow">CHECK YOUR INBOX</span>
            <h1>Reset link is on its way.</h1>
            <p>
              If <strong>{email}</strong> is linked to an account, you&apos;ll receive a
              password reset link shortly. This is a demo, so no email was sent.
            </p>
            <button className="login-submit forgot-submit" type="button" onClick={() => setSubmitted(false)}>
              Try another email <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <span className="login-form-eyebrow">ACCOUNT RECOVERY</span>
            <h1>Forgot your password?</h1>
            <p>No worries. Enter the email address associated with your account and we&apos;ll help you get back in.</p>
            <form className="login-form forgot-form" onSubmit={handleSubmit} noValidate>
              <label className="login-field" htmlFor="reset-email">
                <span>Email address</span>
                <span className={`login-input-wrap ${error ? "login-input-error" : ""}`}>
                  <Mail size={17} />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "reset-email-error" : undefined}
                    required
                  />
                </span>
                {error && <small className="login-error-text" id="reset-email-error">{error}</small>}
              </label>
              <button className="login-submit" type="submit">Send reset link <ArrowRight size={16} /></button>
            </form>
            <Link className="forgot-back-link" href="/login"><ArrowLeft size={15} /> Back to login</Link>
          </>
        )}
      </section>
      <footer className="forgot-footer"><span>© 2026 GarmentConnect</span><span><a href="#privacy">Privacy</a><a href="#help">Help center</a></span></footer>
    </main>
  );
}
