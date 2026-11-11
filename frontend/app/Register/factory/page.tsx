"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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

const steps = ["Contact", "Company", "Capabilities", "Security"];
const countries = [
  "Bangladesh", "China", "India", "Indonesia", "Pakistan", "Portugal",
  "Turkey", "United Kingdom", "United States", "Vietnam", "Other",
];
const processes = [
  "Cutting", "Sewing", "Knitting", "Dyeing", "Washing", "Printing",
  "Embroidery", "Finishing",
];
const products = [
  "T-shirt", "Polo shirt", "Shirt", "Jeans", "Jacket", "Sweater", "Other",
];

function ChoiceChips({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <fieldset className="chip-field">
      <legend>{label}<span className="field-hint"> Select all that apply</span></legend>
      <div className="chip-options">
        {options.map((option) => (
          <label className="choice-chip" key={option}>
            <input type="checkbox" name={name} value={option} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function FactoryRegistrationPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const stepRef = useRef<HTMLDivElement>(null);

  function validateCurrentStep() {
    const activeStep = stepRef.current?.querySelector(
      `[data-step-panel="${step}"]`,
    );
    const fields = activeStep?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input[required], select[required], textarea[required]");
    for (const field of fields ?? []) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  function continueStep() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateCurrentStep()) return;
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      setPasswordError("Passwords must match.");
      const confirmPassword = event.currentTarget.elements.namedItem("confirmPassword");
      if (confirmPassword instanceof HTMLInputElement) confirmPassword.focus();
      return;
    }
    setPasswordError("");
    setSubmitted(true);
  }

  return (
    <FormShell
      title="Register your factory"
      description="Showcase your manufacturing capabilities and connect with buyers."
      factory
      step={step}
      steps={steps}
    >
      <form
        className="registration-form factory-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div ref={stepRef}>
          <section data-step-panel="0" hidden={step !== 0}>
              <FormSectionTitle number="01" title="Contact information" />
              <div className="form-grid">
                <FormField id="representative" label="Owner / representative name" placeholder="e.g. Samira Rahman" autoComplete="name" />
                <FormField id="email" label="Business email" type="email" placeholder="you@yourfactory.com" autoComplete="email" />
                <FormField id="phone" label="Contact number" type="tel" placeholder="+880 1700 000000" autoComplete="tel" />
              </div>
          </section>
          <section data-step-panel="1" hidden={step !== 1}>
              <FormSectionTitle number="02" title="Company information" />
              <div className="form-grid">
                <FormField id="companyName" label="Factory / company name" placeholder="Your company name" />
                <SelectField id="companyType" label="Company type" options={[
                  "Garment Manufacturing Factory", "Knitting Factory", "Dyeing Factory",
                  "Washing Factory", "Printing / Embroidery Factory",
                  "Accessories Manufacturer", "Other",
                ]} />
                <FormField id="address" label="Factory address" placeholder="Street, city, region" />
                <SelectField id="country" label="Country" placeholder="Choose your country" options={countries} />
                <FormField id="website" label="Company website" placeholder="https://yourfactory.com" type="url" required={false} />
              </div>
          </section>
          <section data-step-panel="2" hidden={step !== 2}>
              <FormSectionTitle number="03" title="Manufacturing information" />
              <div className="form-grid">
                <FormField id="capacity" label="Monthly production capacity" placeholder="e.g. 50,000 pieces" />
                <FormField id="workers" label="Number of workers" type="number" placeholder="e.g. 250" />
              </div>
              <ChoiceChips name="processes" label="Manufacturing processes" options={processes} />
              <ChoiceChips name="products" label="Product categories" options={products} />
          </section>
          <section data-step-panel="3" hidden={step !== 3}>
              <FormSectionTitle number="04" title="Account security" />
              <p className="step-helper">Create a secure password to protect your factory profile.</p>
              <div className="form-grid">
                <PasswordField id="password" label="Password" />
                <PasswordField id="confirmPassword" label="Confirm password" />
              </div>
              <TermsCheckbox />
              {passwordError && <p className="field-error" role="alert">{passwordError}</p>}
              {submitted && (
                <SubmitMessage>
                  Your factory profile is ready. This demo keeps your details on this page.
                </SubmitMessage>
              )}
          </section>
        </div>

        <div className="factory-form-actions">
          {step > 0 ? (
            <button className="form-back-button" type="button" onClick={() => setStep((current) => current - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <Link className="form-back-button" href="/Register">
              <ArrowLeft size={16} /> Back
            </Link>
          )}
          {step < steps.length - 1 ? (
            <button className="form-submit continue-button" type="button" onClick={continueStep}>
              Continue <ArrowRight size={17} />
            </button>
          ) : (
            <FormSubmitButton>Create account</FormSubmitButton>
          )}
        </div>
        {step === steps.length - 1 && (
          <p className="login-prompt">
            Already have an account? <Link href="/login">Log in <ArrowRight size={14} /></Link>
          </p>
        )}
        <p className="form-security-note"><Check size={14} /> Your information is encrypted and secure</p>
      </form>
    </FormShell>
  );
}
