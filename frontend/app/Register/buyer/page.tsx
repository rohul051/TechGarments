"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Mail, UserRound } from "lucide-react";
import {
  FormField,
  FormSectionTitle,
  FormShell,
  FormSubmitButton,
  PasswordField,
  SelectField,
  SubmitMessage,
  TermsCheckbox,
} from "../_components";

const countries = [
  "Bangladesh", "China", "India", "Indonesia", "Pakistan", "Portugal",
  "Turkey", "United Kingdom", "United States", "Vietnam", "Other",
];

export default function BuyerRegistrationPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("password") !== data.get("confirmPassword")) {
      const confirmPassword = form.elements.namedItem("confirmPassword");
      if (confirmPassword instanceof HTMLInputElement) {
        confirmPassword.setCustomValidity("Passwords must match");
        confirmPassword.reportValidity();
        confirmPassword.addEventListener("input", () => confirmPassword.setCustomValidity(""), { once: true });
      }
      return;
    }
    setSubmitted(true);
  }

  return (
    <FormShell
      title="Create your buyer account"
      description="Register your business and connect with manufacturing partners."
    >
      <form className="registration-form" onSubmit={handleSubmit}>
        <FormSectionTitle number="01" title="Personal information" />
        <div className="form-grid">
          <FormField id="fullName" label="Full name" placeholder="e.g. Alex Morgan" icon={<UserRound size={16} />} autoComplete="name" />
          <FormField id="email" label="Email address" type="email" placeholder="you@company.com" icon={<Mail size={16} />} autoComplete="email" />
          <FormField id="phone" label="Phone number" type="tel" placeholder="+1 (555) 000-0000" autoComplete="tel" />
        </div>

        <FormSectionTitle number="02" title="Company information" />
        <div className="form-grid">
          <FormField id="companyName" label="Company / brand name" placeholder="Your brand name" />
          <SelectField id="buyerType" label="Buyer type" options={[
            "Clothing Brand", "Retailer", "Wholesaler", "Importer / Exporter", "Individual / Startup",
          ]} />
          <SelectField id="country" label="Country" placeholder="Choose your country" options={countries} />
          <FormField id="website" label="Company website" placeholder="https://yourbrand.com" type="url" required={false} />
        </div>

        <FormSectionTitle number="03" title="Account security" />
        <div className="form-grid">
          <PasswordField id="password" label="Password" />
          <PasswordField id="confirmPassword" label="Confirm password" />
        </div>
        <TermsCheckbox />
        {submitted && (
          <SubmitMessage>
             Thank you! Your information has been submitted successfully. We are excited to connect with you!
          </SubmitMessage>
        )}
        <FormSubmitButton>Create account</FormSubmitButton>
        <p className="login-prompt">
          Already have an account? <Link href="/login">Log in <ArrowRight size={14} /></Link>
        </p>
        <p className="form-security-note"><Check size={14} /> Your information is encrypted and secure</p>
      </form>
    </FormShell>
  );
}
