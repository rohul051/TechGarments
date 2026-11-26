"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Factory,
  Mail,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { register } from "@/lib/auth";
import type { Role } from "@/types/user";
import {
  FormField,
  FormSectionTitle,
  FormShell,
  FormSubmitButton,
  PasswordField,
  SelectField,
  SubmitMessage,
  TermsCheckbox,
} from "./_components";

const countries = [
  "Bangladesh",
  "China",
  "India",
  "Indonesia",
  "Pakistan",
  "Portugal",
  "Turkey",
  "United Kingdom",
  "United States",
  "Vietnam",
  "Other",
];

const buyerTypes = [
  "Clothing Brand",
  "Retailer",
  "Wholesaler",
  "Importer / Exporter",
  "Individual / Startup",
];

const factoryProcesses = [
  "Cutting",
  "Sewing",
  "Knitting",
  "Dyeing",
  "Washing",
  "Printing",
  "Embroidery",
  "Finishing",
];

const factoryProducts = [
  "T-shirt",
  "Polo shirt",
  "Shirt",
  "Jeans",
  "Jacket",
  "Sweater",
  "Activewear",
  "Other",
];

export function UnifiedRegisterForm({
  defaultRole = "BUYER",
}: {
  defaultRole?: Role;
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"BUYER" | "FACTORY">(
    defaultRole === "FACTORY" ? "FACTORY" : "BUYER",
  );
  const [submitted, setSubmitted] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setPasswordError("Please enter a valid email address.");
      const emailInput = form.elements.namedItem("email");
      if (emailInput instanceof HTMLInputElement) emailInput.focus();
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      const passwordInput = form.elements.namedItem("password");
      if (passwordInput instanceof HTMLInputElement) passwordInput.focus();
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match. Please verify.");
      const confirmInput = form.elements.namedItem("confirmPassword");
      if (confirmInput instanceof HTMLInputElement) {
        confirmInput.focus();
      }
      return;
    }

    setIsSubmitting(true);

    const fullName = String(data.get("fullName") || (selectedRole === "BUYER" ? "Brand Partner" : "Factory Partner")).trim();
    const phone = String(data.get("phone") || "").trim();
    const companyName = String(data.get("companyName") || (selectedRole === "BUYER" ? "My Brand" : "Garment Factory")).trim();
    const country = String(data.get("country") || "Other").trim();
    const website = String(data.get("website") || "").trim();

    // Buyer-specific fields
    const buyerType = String(data.get("buyerType") || "Clothing Brand");

    // Factory-specific fields
    const city = String(data.get("city") || "").trim();
    const monthlyCapacityStr = String(data.get("monthlyCapacity") || "50000");
    const monthlyCapacity = parseInt(monthlyCapacityStr.replace(/\D/g, ""), 10) || 50000;
    const moqStr = String(data.get("moq") || "500");
    const moq = parseInt(moqStr.replace(/\D/g, ""), 10) || 500;

    const processes = data.getAll("processes").map(String);
    const products = data.getAll("products").map(String);

    try {
      await register({
        email,
        password,
        fullName,
        role: selectedRole,
        phone,
        companyName,
        country,
        website,
        ...(selectedRole === "BUYER"
          ? { buyerType }
          : {
              city,
              monthlyCapacity,
              moq,
              processes: processes.length > 0 ? processes : ["Cutting", "Sewing", "Finishing"],
              products: products.length > 0 ? products : ["T-shirt", "Shirt"],
            }),
      });

      setSubmitted(true);

      // Transition smoothly to the login page with prefilled registered email and role
      window.setTimeout(() => {
        router.push(
          `/login?registered=true&email=${encodeURIComponent(email)}&role=${selectedRole}`,
        );
      }, 1200);
    } catch (err) {
      console.error("Registration error:", err);
      setPasswordError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Create your account"
      description="Connect directly with verified apparel partners, discover production capacity, and grow your business."
      factory={selectedRole === "FACTORY"}
    >
      <form className="registration-form" onSubmit={handleSubmit} noValidate>
        {/* 1. Account Role Radio Button Selector */}
        <div className="mb-2">
          <label className="field-label block mb-2">
            I am registering as <span className="required-mark">*</span>
          </label>

          <div className="role-radio-group" role="radiogroup" aria-label="Select Account Role">
            {/* Radio Option 1: Brand / Buyer */}
            <label
              className={`role-radio-card ${
                selectedRole === "BUYER" ? "role-radio-active" : ""
              }`}
              onClick={() => setSelectedRole("BUYER")}
            >
              <input
                type="radio"
                name="accountRole"
                value="BUYER"
                checked={selectedRole === "BUYER"}
                onChange={() => setSelectedRole("BUYER")}
                className="role-radio-input"
              />
              <div className="role-radio-body">
                <div className="role-radio-header">
                  <ShoppingBag className="role-radio-icon" size={19} />
                  <span className="role-radio-title">Brand / Buyer</span>
                  <span className="role-radio-badge">Brands &amp; Retailers</span>
                </div>
                <p className="role-radio-desc">
                  Source apparel, post RFQs, compare quotations, and hire verified garment factories.
                </p>
              </div>
            </label>

            {/* Radio Option 2: Factory / Manufacturer */}
            <label
              className={`role-radio-card ${
                selectedRole === "FACTORY" ? "role-radio-active" : ""
              }`}
              onClick={() => setSelectedRole("FACTORY")}
            >
              <input
                type="radio"
                name="accountRole"
                value="FACTORY"
                checked={selectedRole === "FACTORY"}
                onChange={() => setSelectedRole("FACTORY")}
                className="role-radio-input"
              />
              <div className="role-radio-body">
                <div className="role-radio-header">
                  <Factory className="role-radio-icon" size={19} />
                  <span className="role-radio-title">Factory / Maker</span>
                  <span className="role-radio-badge">Manufacturers</span>
                </div>
                <p className="role-radio-desc">
                  Showcase factory capabilities, share open machine capacity, and accept production orders.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 2. Universal Account Credentials */}
        <FormSectionTitle number="01" title="Account credentials" />
        <div className="form-grid">
          <FormField
            id="fullName"
            label={selectedRole === "BUYER" ? "Full name / Contact person" : "Owner / Representative name"}
            placeholder={selectedRole === "BUYER" ? "e.g. Alex Morgan" : "e.g. Samira Rahman"}
            icon={<UserRound size={16} />}
            autoComplete="name"
          />
          <FormField
            id="email"
            label="Email address (Login Email ID)"
            type="email"
            placeholder={selectedRole === "BUYER" ? "you@brand.com" : "you@factory.com"}
            icon={<Mail size={16} />}
            autoComplete="email"
          />
          <FormField
            id="phone"
            label="Contact phone number"
            type="tel"
            placeholder="+1 (555) 000-0000 or +880 1700 000000"
            autoComplete="tel"
          />
        </div>

        {/* 3. Role-Specific Business Information */}
        <FormSectionTitle
          number="02"
          title={selectedRole === "BUYER" ? "Brand & company details" : "Factory & production details"}
        />

        {selectedRole === "BUYER" ? (
          /* Buyer / Brand Fields */
          <div className="form-grid">
            <FormField
              id="companyName"
              label="Company / Brand name"
              placeholder="e.g. Nordic Apparel Ltd."
            />
            <SelectField
              id="buyerType"
              label="Buyer type"
              options={buyerTypes}
            />
            <SelectField
              id="country"
              label="Country of operation"
              placeholder="Select your country"
              options={countries}
            />
            <FormField
              id="website"
              label="Company website (optional)"
              placeholder="https://yourbrand.com"
              type="url"
              required={false}
            />
          </div>
        ) : (
          /* Factory / Manufacturer Fields */
          <div className="space-y-4">
            <div className="form-grid">
              <FormField
                id="companyName"
                label="Factory / Company name"
                placeholder="e.g. Apex Garments & Knitting Ltd."
              />
              <SelectField
                id="country"
                label="Factory country"
                placeholder="Select factory country"
                options={countries}
              />
              <FormField
                id="city"
                label="City / Industrial zone"
                placeholder="e.g. Gazipur, Dhaka or Tirupur"
              />
              <FormField
                id="website"
                label="Factory website (optional)"
                placeholder="https://apexgarments.com"
                type="url"
                required={false}
              />
              <FormField
                id="monthlyCapacity"
                label="Monthly production capacity"
                placeholder="e.g. 50,000 pcs / month"
                type="text"
                required={false}
              />
              <FormField
                id="moq"
                label="Minimum Order Quantity (MOQ)"
                placeholder="e.g. 500 pcs"
                type="text"
                required={false}
              />
            </div>

            {/* Manufacturing Processes Chips */}
            <fieldset className="chip-field">
              <legend>
                Production processes <span className="field-hint">Select all that apply</span>
              </legend>
              <div className="chip-options">
                {factoryProcesses.map((proc) => (
                  <label className="choice-chip" key={proc}>
                    <input type="checkbox" name="processes" value={proc} defaultChecked={["Cutting", "Sewing", "Finishing"].includes(proc)} />
                    <span>{proc}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Product Specialization Chips */}
            <fieldset className="chip-field">
              <legend>
                Garment products <span className="field-hint">Select all that apply</span>
              </legend>
              <div className="chip-options">
                {factoryProducts.map((prod) => (
                  <label className="choice-chip" key={prod}>
                    <input type="checkbox" name="products" value={prod} defaultChecked={["T-shirt", "Shirt"].includes(prod)} />
                    <span>{prod}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {/* 4. Password & Security */}
        <FormSectionTitle number="03" title="Account security" />
        <div className="form-grid">
          <PasswordField id="password" label="Password (min 8 characters)" />
          <PasswordField id="confirmPassword" label="Confirm password" />
        </div>

        {passwordError && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {passwordError}
          </div>
        )}

        {/* 5. Terms & Submission */}
        <TermsCheckbox />

        {submitted && (
          <SubmitMessage>
            Account created successfully as {selectedRole === "BUYER" ? "Brand" : "Factory"}! Taking you to the login page to sign in...
          </SubmitMessage>
        )}

        <FormSubmitButton>
          {isSubmitting
            ? "Creating account..."
            : `Create Account as ${selectedRole === "BUYER" ? "Brand / Buyer" : "Factory"}`}
        </FormSubmitButton>

        <p className="login-prompt">
          Already have an account? <Link href="/login">Log in <ArrowRight size={14} /></Link>
        </p>

        <p className="form-security-note">
          <Check size={14} /> End-to-end encrypted production workspace
        </p>
      </form>
    </FormShell>
  );
}
