"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ShoppingBag,
  Sparkles,
  Shirt,
} from "lucide-react";
import { login } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid registered email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredParam = searchParams.get("registered");
  const deletedParam = searchParams.get("deleted");
  const emailParam = searchParams.get("email");
  const roleParam = searchParams.get("role");

  const [selectedRole, setSelectedRole] = useState<"BUYER" | "FACTORY">(() =>
    roleParam?.toUpperCase() === "FACTORY" ? "FACTORY" : "BUYER",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(() =>
    registeredParam === "true"
      ? "Account created successfully! Please sign in with your registered email address and password."
      : deletedParam === "true"
        ? "Your account has been permanently deleted."
        : null,
  );
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailParam || "", password: "" },
  });

  useEffect(() => {
    if (emailParam && emailParam.includes("@")) {
      setValue("email", emailParam, { shouldValidate: true });
    }
  }, [emailParam, setValue]);

  async function onSubmit({ email, password }: LoginValues) {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const user = await login(email, password, selectedRole);
      localStorage.setItem("rememberMe", String(rememberMe));
      setSuccessMessage(`Welcome back, ${user.fullName}. Taking you to your dashboard...`);
      window.setTimeout(() => {
        if (user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else if (user.role === "BUYER") {
          router.push("/buyer/dashboard");
        } else {
          router.push("/factory/dashboard");
        }
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
          <div className="login-feature">
            <span><ShieldCheck size={16} /></span>
            <div><b>Verified Manufacturers</b><small>100% compliance checked</small></div>
          </div>
          <div className="login-feature">
            <span><Sparkles size={16} /></span>
            <div><b>Smart Order Tracking</b><small>Live milestone production status</small></div>
          </div>
        </div>

        <div className="login-brand-footer">
          <span>THREADLINE OS</span>
          <span>ENTERPRISE GRADE SOURCING</span>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-mobile-brand">
          <Link className="login-brand" href="/">
            <span className="login-brand-mark"><Shirt size={19} /></span>
            <span>GarmentConnect<span className="login-brand-dot">.</span></span>
          </Link>
        </div>

        <div className="login-form-wrap">
          <div className="login-welcome">
            <span className="login-form-eyebrow">YOUR WORKSPACE IS WAITING</span>
            <h2>Welcome back<span>.</span></h2>
            <p>Select Buyer or Factory and sign in with your registered email and password.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="login-field">
              <span>Account type</span>
              <div className="login-role-radio-group" role="radiogroup" aria-label="Select account type">
                <label className={`login-role-radio ${selectedRole === "BUYER" ? "login-role-radio-active" : ""}`}>
                  <input
                    type="radio"
                    name="loginRole"
                    value="BUYER"
                    checked={selectedRole === "BUYER"}
                    onChange={() => {
                      setSelectedRole("BUYER");
                      setErrorMessage(null);
                    }}
                    className="login-role-radio-input"
                  />
                  <ShoppingBag className="login-role-radio-icon" size={14} />
                  <span>Buyer</span>
                </label>

                <label className={`login-role-radio ${selectedRole === "FACTORY" ? "login-role-radio-active" : ""}`}>
                  <input
                    type="radio"
                    name="loginRole"
                    value="FACTORY"
                    checked={selectedRole === "FACTORY"}
                    onChange={() => {
                      setSelectedRole("FACTORY");
                      setErrorMessage(null);
                    }}
                    className="login-role-radio-input"
                  />
                  <Factory className="login-role-radio-icon" size={14} />
                  <span>Factory</span>
                </label>
              </div>
            </div>

            <label className="login-field" htmlFor="email">
              <span>Registered Email address</span>
              <span className={`login-input-wrap ${errors.email ? "login-input-error" : ""}`}>
                <Mail size={17} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={selectedRole === "BUYER" ? "e.g. buyer@brand.com" : "e.g. factory@company.com"}
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
                <span className="remember-box"><Check size={11} strokeWidth={3} /></span>
                <span>Remember me</span>
              </label>

              <Link href="/forgot-password">Forgot password?</Link>
            </div>

            {errorMessage && (
              <div className="login-alert login-alert-error" role="alert">
                <span>!</span>
                <div>{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="login-alert login-alert-success" role="status">
                <span>✓</span>
                <div>{successMessage}</div>
              </div>
            )}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><span className="login-spinner" /> Signing in...</> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="login-register-prompt" style={{ marginTop: 28 }}>
            Don&apos;t have an account? <Link href="/Register">Register here <ArrowRight size={13} /></Link>
          </p>

          <div className="login-security-note">
            <Check size={14} /> End-to-end encrypted production workspace
          </div>
        </div>

        <div className="login-mobile-footer">
          <p>By signing in, you agree to our Terms and Privacy Policy.</p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-experience" />}>
      <LoginForm />
    </Suspense>
  );
}
