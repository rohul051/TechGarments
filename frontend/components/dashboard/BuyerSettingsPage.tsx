"use client";

import { useRef, useState } from "react";
import {
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Globe,
  LockKeyhole,
  Mail,
  Palette,
  Phone,
  UserRound,
} from "lucide-react";
import {
  BUYER_TYPE_OPTIONS,
  compressProfilePicture,
  normalizeWebsiteUrl,
} from "@/lib/buyerSettings";
import type { BuyerProfileDetails, BuyerTheme } from "@/types/user";
import {
  AccountSettingsSection,
  getDisplayInitials,
  ThemeSettingsSection,
} from "./WorkspaceSettingsSections";

interface BuyerSettingsPageProps {
  profile: BuyerProfileDetails;
  theme: BuyerTheme;
  onSaveProfile: (nextProfile: BuyerProfileDetails) => Promise<string>;
  onChangeTheme: (nextTheme: BuyerTheme) => Promise<void> | void;
  onResetAccount: () => Promise<string>;
  onDeleteAccount: (password: string) => Promise<void>;
}

export function BuyerSettingsPage({
  profile,
  theme,
  onSaveProfile,
  onChangeTheme,
  onResetAccount,
  onDeleteAccount,
}: BuyerSettingsPageProps) {
  const [prevProfile, setPrevProfile] = useState(profile);
  const [draft, setDraft] = useState<BuyerProfileDetails>(profile);

  // Sync draft cleanly when parent profile refreshes (e.g. from Firestore or account reset)
  if (prevProfile !== profile) {
    setPrevProfile(profile);
    setDraft(profile);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Settings states
  const [photoBusy, setPhotoBusy] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const hasPhoto = Boolean(draft.photoURL?.trim());
  const buyerTypeChoices = BUYER_TYPE_OPTIONS.includes(draft.buyerType as (typeof BUYER_TYPE_OPTIONS)[number])
    ? [...BUYER_TYPE_OPTIONS]
    : draft.buyerType
      ? [draft.buyerType, ...BUYER_TYPE_OPTIONS]
      : [...BUYER_TYPE_OPTIONS];

  function updateField<K extends keyof BuyerProfileDetails>(field: K, value: BuyerProfileDetails[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setProfileMessage("");
    setProfileError("");
  }

  async function handlePictureSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const compressedDataUrl = await compressProfilePicture(file);
      const nextProfile: BuyerProfileDetails = { ...draft, photoURL: compressedDataUrl };
      setDraft(nextProfile);
      await onSaveProfile(nextProfile);
      setProfileMessage(
        hasPhoto
          ? "Profile picture updated."
          : "Profile picture added to your buyer account.",
      );
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not upload profile picture.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleRemovePicture() {
    if (!hasPhoto || photoBusy) return;
    setPhotoBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const nextProfile: BuyerProfileDetails = { ...draft, photoURL: "" };
      setDraft(nextProfile);
      await onSaveProfile(nextProfile);
      setProfileMessage("Profile picture removed.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not remove profile picture.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profileSaving) return;

    const cleanName = draft.fullName.trim();
    const cleanCompany = draft.companyName.trim();
    const cleanPhone = draft.phone.trim();
    const cleanBuyerType = draft.buyerType.trim() || "Clothing Brand";

    if (cleanName.length < 2) {
      setProfileError("Please enter a valid display name (at least 2 characters).");
      return;
    }
    if (!cleanCompany) {
      setProfileError("Please enter your company or brand name.");
      return;
    }

    const urlCheck = normalizeWebsiteUrl(draft.website);
    if (!urlCheck.valid) {
      setProfileError(urlCheck.error || "Please enter a valid company website URL.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const nextProfile: BuyerProfileDetails = {
        ...draft,
        fullName: cleanName,
        companyName: cleanCompany,
        phone: cleanPhone,
        buyerType: cleanBuyerType,
        website: urlCheck.value,
      };
      const resultMessage = await onSaveProfile(nextProfile);
      setDraft(nextProfile);
      setProfileMessage(resultMessage);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to save profile settings.");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="buyer-settings-stack">
      <div className="workspace-section-heading">
        <div>
          <span className="workspace-eyebrow">BUYER PREFERENCES &amp; CONTROLS</span>
          <h2>Settings</h2>
          <p>Update your buyer profile, customize your workspace theme, and manage account security.</p>
        </div>
      </div>

      {/* Quick section jump pills */}
      <nav className="buyer-settings-nav" aria-label="Settings sections">
        <a href="#buyer-profile-settings"><UserRound size={15} /> Profile Settings</a>
        <a href="#buyer-theme-settings"><Palette size={15} /> Theme Colour</a>
        <a href="#buyer-account-settings"><LockKeyhole size={15} /> Account Settings</a>
      </nav>

      {/* 1. PROFILE SETTINGS */}
      <section id="buyer-profile-settings" className="workspace-panel buyer-settings-panel">
        <div className="buyer-settings-panel-header">
          <div>
            <span className="workspace-eyebrow">01 · PROFILE SETTINGS</span>
            <h3>Buyer Profile &amp; Brand Identity</h3>
            <p>Manage your display name, profile photo, contact details, and company profile shown to factories.</p>
          </div>
        </div>

        {/* Profile Picture Upload / Change */}
        <div className="buyer-avatar-editor">
          <div className="buyer-avatar-preview" aria-label="Profile picture preview">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.photoURL} alt={draft.fullName || "Buyer profile"} />
            ) : (
              <span>{getDisplayInitials(draft.fullName || "Buyer", "BU")}</span>
            )}
          </div>

          <div className="buyer-avatar-controls">
            <h4>{hasPhoto ? "Your profile picture" : "No profile picture added yet"}</h4>
            <p>Upload a crisp square headshot or brand logo (PNG, JPG, or WebP).</p>
            <div className="buyer-avatar-buttons">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                aria-label={hasPhoto ? "Change profile picture" : "Add profile picture"}
                onChange={handlePictureSelected}
              />
              <button
                type="button"
                className="workspace-primary-button compact-button"
                disabled={photoBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={15} />
                {photoBusy
                  ? "Uploading..."
                  : hasPhoto
                    ? "Change Profile picture"
                    : "Add profile picture"}
              </button>
              {hasPhoto && (
                <button
                  type="button"
                  className="cancel-button"
                  disabled={photoBusy}
                  onClick={() => void handleRemovePicture()}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <form className="buyer-settings-form" onSubmit={handleSaveProfile} noValidate>
          <div className="request-form-grid">
            <label className="workspace-field">
              <span>Full Name (Rename) *</span>
              <div className="buyer-input-icon">
                <UserRound size={15} />
                <input
                  type="text"
                  required
                  value={draft.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="e.g. Alex Morgan"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Phone Number</span>
              <div className="buyer-input-icon">
                <Phone size={15} />
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Company Name *</span>
              <div className="buyer-input-icon">
                <Building2 size={15} />
                <input
                  type="text"
                  required
                  value={draft.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="e.g. Northstar Studio"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Buyer Type *</span>
              <select
                value={draft.buyerType}
                onChange={(e) => updateField("buyerType", e.target.value)}
              >
                {buyerTypeChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="workspace-field field-full">
              <span>Company Web URL</span>
              <div className="buyer-input-icon">
                <Globe size={15} />
                <input
                  type="url"
                  value={draft.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>
            </label>
          </div>

          {profileError && (
            <div className="profile-edit-error" role="alert">
              {profileError}
            </div>
          )}
          {profileMessage && (
            <div className="profile-save-message" role="status">
              <CheckCircle2 size={16} />
              <span>{profileMessage}</span>
            </div>
          )}

          <div className="buyer-settings-footer">
            <span className="buyer-readonly-note">
              <Mail size={14} /> Account email: <strong>{profile.email}</strong>
            </span>
            <button
              type="submit"
              className="workspace-primary-button"
              disabled={profileSaving}
            >
              {profileSaving ? "Saving changes..." : <>Save Profile Settings <Check size={15} /></>}
            </button>
          </div>
        </form>
      </section>

      {/* 2. THEME COLOUR */}
      <ThemeSettingsSection
        sectionId="buyer-theme-settings"
        roleTitle="Buyer"
        theme={theme}
        onChangeTheme={onChangeTheme}
      />

      {/* 3. ACCOUNT SETTINGS */}
      <AccountSettingsSection
        sectionId="buyer-account-settings"
        email={profile.email}
        roleLabel="buyer"
        resetDescription="Restore your buyer workspace to clean defaults (clears saved factories, local requests/orders cache, theme colour, and custom profile photo/company fields while keeping your login)."
        resetModalSummary={
          <>
            This will restore your buyer settings to defaults: reset Theme colour to <strong>Default</strong>, remove your custom profile picture, phone, and website, reset Company Name and Buyer Type to defaults, and clear saved factories and browser-saved requests/orders. Your login email and password will stay active.
          </>
        }
        onResetAccount={onResetAccount}
        onDeleteAccount={onDeleteAccount}
      />
    </div>
  );
}
