"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Factory,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Shirt,
  ShoppingBag,
} from "lucide-react";
import { login } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: "Buyer", email: "buyer@threadline.demo", password: "buyer1234", icon: ShoppingBag },
  { role: "Factory", email: "factory@threadline.demo", password: "factory1234", icon: Factory },
];

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function chooseDemoAccount(account: (typeof demoAccounts)[number]) {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function onSubmit({ email, password }: LoginValues) {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const user = await login(email, password);
      localStorage.setItem("rememberMe", String(rememberMe));
      setSuccessMessage(`Welcome back, ${user.fullName}. Taking you to your workspace...`);
      window.setTimeout(() => {
        router.push(user.role === "BUYER" ? "/buyer/dashboard" : "/factory/dashboard");
      }, 750);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in. Try again.",
      );
    }
  }

  return (
    <main className="login-experience">
      <section className="login-brand-panel">
        <Link className="login-brand" href="/" aria-label="GarmentConnect home">
          <span className="login-brand-mark"><Shirt size={19} /></span>
          <span>GarmentConnect<span className="login-brand-dot">.</span></span>
        </Link>

        <div className="login-brand-copy">
          <span className="login-kicker"><Sparkles size={14} /> THE FUTURE OF APPAREL, CONNECTED</span>
          <h1>Connect.<br />Manufacture.<br /><em>Grow.</em></h1>
          <p>Your gateway to smarter garment manufacturing and trusted production partnerships.</p>
        </div>

        <div className="login-visual" aria-label="Garment production at work">
          <div className="login-visual-image" />
          <div className="visual-glass-card">
            <span className="visual-glass-icon"><BadgeCheck size={17} /></span>
            <span><b>Production, in sync</b><small>Every partner. One platform.</small></span>
            <span className="visual-live-dot" />
          </div>
          <div className="visual-caption"><span>01 — MADE TOGETHER</span><span>From first stitch to final delivery</span></div>
          <div className="visual-orbit orbit-a" />
          <div className="visual-orbit orbit-b" />
        </div>

        <div className="login-features">
          <div className="login-feature"><span><ShieldCheck size={17} /></span><div><b>Verified manufacturing partners</b><small>Work with trusted, vetted factories.</small></div></div>
          <div className="login-feature"><span><Sparkles size={17} /></span><div><b>AI-powered factory matching</b><small>Find the right production fit, faster.</small></div></div>
          <div className="login-feature"><span><Factory size={17} /></span><div><b>Smart production management</b><small>Keep every order moving forward.</small></div></div>
        </div>

        <div className="login-brand-footer"><span>BUILT FOR THE PEOPLE WHO MAKE THINGS</span><span>© 2026 GarmentConnect</span></div>
      </section>

      <section className="login-form-panel">
        <div className="login-mobile-brand">
          <Link className="login-brand" href="/" aria-label="GarmentConnect home">
            <span className="login-brand-mark"><Shirt size={18} /></span>
            <span>GarmentConnect<span className="login-brand-dot">.</span></span>
          </Link>
        </div>

        <div className="login-form-wrap">
          <div className="login-welcome">
            <span className="login-form-eyebrow">YOUR WORKSPACE IS WAITING</span>
            <h2>Welcome back<span>.</span></h2>
            <p>Sign in to your account to continue.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="login-field" htmlFor="email">
              <span>Email address</span>
              <span className={`login-input-wrap ${errors.email ? "login-input-error" : ""}`}>
                <Mail size={17} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </span>
              {errors.email && <small className="login-error-text" id="email-error">{errors.email.message}</small>}
            </label>

            <label className="login-field" htmlFor="password">
              <span>Password</span>
              <span className={`login-input-wrap ${errors.password ? "login-input-error" : ""}`}>
                <LockKeyhole size={17} />
                <input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                >
                  {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
              {errors.password && <small className="login-error-text" id="password-error">{errors.password.message}</small>}
            </label>

            <div className="login-options">
              <label className="remember-control">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span className="remember-box"><Check size={12} /></span>
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password">Forgot password?</Link>
            </div>

            {errorMessage && (
              <div className="login-alert login-alert-error" role="alert">
                <span>!</span>{errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="login-alert login-alert-success" role="status">
                <Check size={15} />{successMessage}
              </div>
            )}

            <button className="login-submit" type="submit" disabled={isSubmitting || Boolean(successMessage)}>
              {isSubmitting ? <><span className="login-spinner" />Signing you in...</> : successMessage ? <>Signed in <Check size={17} /></> : <>Sign in <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="login-divider"><span>OR TRY A DEMO ACCOUNT</span></div>
          <div className="demo-account-list">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <button className="demo-account" type="button" key={account.role} onClick={() => chooseDemoAccount(account)}>
                  <span className="demo-account-icon"><Icon size={16} /></span>
                  <span><b>{account.role} demo</b><small>{account.email}</small></span>
                  <ArrowRight size={15} />
                </button>
              );
            })}
          </div>

          <p className="login-register-prompt">
            Don&apos;t have an account? <Link href="/Register">Create account <ArrowRight size={14} /></Link>
          </p>

          <div className="login-security-note"><ShieldCheck size={14} /> Secure access to your manufacturing workspace</div>
        </div>
        <div className="login-mobile-footer"><Link href="/Register">Create account</Link><span>·</span><a href="#privacy">Privacy</a><span>·</span><a href="#help">Help</a></div>
      </section>
    </main>
  );
}
