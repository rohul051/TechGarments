"use client";

import { useRef, useState } from "react";
import {
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Factory,
  Gauge,
  Globe,
  ImagePlus,
  LockKeyhole,
  Mail,
  MapPin,
  Package,
  Palette,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  compressCoverImage,
  compressProfilePicture,
  normalizeWebsiteUrl,
} from "@/lib/buyerSettings";
import type { BuyerTheme, FactoryProfileDetails } from "@/types/user";
import {
  AccountSettingsSection,
  getDisplayInitials,
  ThemeSettingsSection,
} from "./WorkspaceSettingsSections";

interface FactorySettingsPageProps {
  profile: FactoryProfileDetails;
  theme: BuyerTheme;
  onSaveProfile: (nextProfile: FactoryProfileDetails) => Promise<string>;
  onChangeTheme: (nextTheme: BuyerTheme) => Promise<void> | void;
  onResetAccount: () => Promise<string>;
  onDeleteAccount: (password: string) => Promise<void>;
}

export function FactorySettingsPage({
  profile,
  theme,
  onSaveProfile,
  onChangeTheme,
  onResetAccount,
  onDeleteAccount,
}: FactorySettingsPageProps) {
  const [prevProfile, setPrevProfile] = useState(profile);
  const [draft, setDraft] = useState<FactoryProfileDetails>(profile);

  if (prevProfile !== profile) {
    setPrevProfile(profile);
    setDraft(profile);
  }

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [photoBusy, setPhotoBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const hasPhoto = Boolean(draft.photoURL?.trim());
  const hasCover = Boolean(draft.coverPhotoURL?.trim());

  function updateField<K extends keyof FactoryProfileDetails>(
    field: K,
    value: FactoryProfileDetails[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setProfileMessage("");
    setProfileError("");
  }

  async function handleAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || photoBusy) return;

    setPhotoBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const compressedDataUrl = await compressProfilePicture(file);
      const nextProfile: FactoryProfileDetails = { ...draft, photoURL: compressedDataUrl };
      setDraft(nextProfile);
      await onSaveProfile(nextProfile);
      setProfileMessage(
        hasPhoto
          ? "Profile picture updated."
          : "Profile picture added to your factory account.",
      );
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not upload profile picture.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!hasPhoto || photoBusy) return;
    setPhotoBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const nextProfile: FactoryProfileDetails = { ...draft, photoURL: "" };
      setDraft(nextProfile);
      await onSaveProfile(nextProfile);
      setProfileMessage("Profile picture removed.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not remove profile picture.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleCoverSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || coverBusy) return;

    setCoverBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const compressedCoverUrl = await compressCoverImage(file);
      const nextProfile: FactoryProfileDetails = { ...draft, coverPhotoURL: compressedCoverUrl };
      setDraft(nextProfile);
      await onSaveProfile(nextProfile);
      setProfileMessage(
        hasCover
          ? "Factory background photo updated."
          : "Factory background photo added.",
      );
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not upload background photo.");
    } finally {
      setCoverBusy(false);
    }
  }

  async function handleRemoveCover() {
    if (!hasCover || coverBusy) return;
    setCoverBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const nextProfile: FactoryProfileDetails = { ...draft, coverPhotoURL: "" };
      setDraft(nextProfile);
      await onSaveProfile(nextProfile);
      setProfileMessage("Factory background photo removed.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not remove background photo.");
    } finally {
      setCoverBusy(false);
    }
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profileSaving) return;

    const cleanName = draft.fullName.trim();
    const cleanCompany = draft.companyName.trim();
    const cleanPhone = draft.phone.trim();
    const cleanCountry = draft.country.trim();
    const cleanCity = draft.city.trim();

    if (cleanName.length < 2) {
      setProfileError("Please enter a valid representative name (at least 2 characters).");
      return;
    }
    if (!cleanCompany) {
      setProfileError("Please enter your factory or company name.");
      return;
    }
    if (!cleanCountry) {
      setProfileError("Please enter your factory country.");
      return;
    }

    const urlCheck = normalizeWebsiteUrl(draft.website);
    if (!urlCheck.valid) {
      setProfileError(urlCheck.error || "Please enter a valid factory website URL.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const nextProfile: FactoryProfileDetails = {
        ...draft,
        fullName: cleanName,
        companyName: cleanCompany,
        phone: cleanPhone,
        country: cleanCountry,
        city: cleanCity,
        website: urlCheck.value,
        monthlyCapacity: Math.max(0, Number(draft.monthlyCapacity) || 0),
        moq: Math.max(0, Number(draft.moq) || 0),
      };
      const resultMessage = await onSaveProfile(nextProfile);
      setDraft(nextProfile);
      setProfileMessage(resultMessage);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to save factory settings.");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="buyer-settings-stack">
      <div className="workspace-section-heading">
        <div>
          <span className="workspace-eyebrow">FACTORY PREFERENCES &amp; CONTROLS</span>
          <h2>Settings</h2>
          <p>Manage your factory profile, cover banner, workspace theme colour, and account security.</p>
        </div>
      </div>

      <nav className="buyer-settings-nav" aria-label="Factory settings sections">
        <a href="#factory-profile-settings"><Factory size={15} /> Profile Settings</a>
        <a href="#factory-theme-settings"><Palette size={15} /> Theme Colour</a>
        <a href="#factory-account-settings"><LockKeyhole size={15} /> Account Settings</a>
      </nav>

      {/* 1. PROFILE SETTINGS */}
      <section id="factory-profile-settings" className="workspace-panel buyer-settings-panel">
        <div className="buyer-settings-panel-header">
          <div>
            <span className="workspace-eyebrow">01 · PROFILE SETTINGS</span>
            <h3>Factory Profile &amp; Visual Presence</h3>
            <p>Update your representative name, profile photo, banner background, contact info, and production specs.</p>
          </div>
        </div>

        {/* Profile Picture Upload / Change */}
        <div className="buyer-avatar-editor">
          <div className="buyer-avatar-preview" aria-label="Factory profile picture preview">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.photoURL} alt={draft.fullName || "Factory profile"} />
            ) : (
              <span>{getDisplayInitials(draft.companyName || draft.fullName || "Factory", "FA")}</span>
            )}
          </div>

          <div className="buyer-avatar-controls">
            <h4>{hasPhoto ? "Factory profile picture" : "No profile picture added yet"}</h4>
            <p>Displayed in your workspace bar and factory account header (PNG, JPG, or WebP).</p>
            <div className="buyer-avatar-buttons">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                aria-label={hasPhoto ? "Change profile picture" : "Add profile picture"}
                onChange={(event) => void handleAvatarSelected(event)}
              />
              <button
                type="button"
                className="workspace-primary-button compact-button"
                disabled={photoBusy}
                onClick={() => avatarInputRef.current?.click()}
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
                  onClick={() => void handleRemoveAvatar()}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cover Background Photo Upload / Edit */}
        <div className="factory-cover-editor">
          <div className="factory-cover-preview">
            {hasCover ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.coverPhotoURL}
                  alt={`${draft.companyName || "Factory"} cover background`}
                  className="profile-cover-img"
                />
                <div className="profile-cover-overlay" />
              </>
            ) : (
              <div className="factory-cover-default-tag">Default factory background</div>
            )}
          </div>
          <div className="factory-cover-controls">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only-file"
              aria-label={hasCover ? "Edit background photo" : "Add background photo"}
              onChange={(event) => void handleCoverSelected(event)}
            />
            <button
              type="button"
              className="cancel-button factory-cover-upload-btn"
              disabled={coverBusy}
              onClick={() => coverInputRef.current?.click()}
            >
              {hasCover ? <><Camera size={14} /> {coverBusy ? "Uploading..." : "Edit background photo"}</> : <><ImagePlus size={14} /> {coverBusy ? "Uploading..." : "Add background photo"}</>}
            </button>
            {hasCover && (
              <button
                type="button"
                className="factory-cover-remove-btn"
                disabled={coverBusy}
                onClick={() => void handleRemoveCover()}
              >
                <Trash2 size={14} /> Remove background
              </button>
            )}
          </div>
        </div>

        <form className="buyer-settings-form" onSubmit={handleSaveProfile} noValidate>
          <div className="request-form-grid">
            <label className="workspace-field">
              <span>Representative Name (Rename) *</span>
              <div className="buyer-input-icon">
                <UserRound size={15} />
                <input
                  type="text"
                  required
                  value={draft.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="e.g. Samira Rahman"
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
                  placeholder="e.g. +880 1700 000000"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Factory / Company Name *</span>
              <div className="buyer-input-icon">
                <Building2 size={15} />
                <input
                  type="text"
                  required
                  value={draft.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="e.g. Logous Knitwear Ltd."
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Country *</span>
              <div className="buyer-input-icon">
                <MapPin size={15} />
                <input
                  type="text"
                  required
                  value={draft.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="e.g. Bangladesh"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>City / Industrial Zone</span>
              <div className="buyer-input-icon">
                <Factory size={15} />
                <input
                  type="text"
                  value={draft.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="e.g. Gazipur, Dhaka"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Monthly Capacity (pcs)</span>
              <div className="buyer-input-icon">
                <Gauge size={15} />
                <input
                  type="number"
                  min="0"
                  value={draft.monthlyCapacity || ""}
                  onChange={(e) => updateField("monthlyCapacity", Number(e.target.value) || 0)}
                  placeholder="e.g. 50000"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Minimum Order Quantity (MOQ)</span>
              <div className="buyer-input-icon">
                <Package size={15} />
                <input
                  type="number"
                  min="0"
                  value={draft.moq || ""}
                  onChange={(e) => updateField("moq", Number(e.target.value) || 0)}
                  placeholder="e.g. 500"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Factory Web URL</span>
              <div className="buyer-input-icon">
                <Globe size={15} />
                <input
                  type="url"
                  value={draft.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://yourfactory.com"
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
        sectionId="factory-theme-settings"
        roleTitle="Factory"
        theme={theme}
        onChangeTheme={onChangeTheme}
      />

      {/* 3. ACCOUNT SETTINGS */}
      <AccountSettingsSection
        sectionId="factory-account-settings"
        email={profile.email}
        roleLabel="factory"
        resetDescription="Restore your factory workspace to clean defaults (clears local quotes/orders cache, theme colour, custom profile picture, cover photo, and optional fields while keeping your login)."
        resetModalSummary={
          <>
            This will restore your factory settings to defaults: reset Theme colour to <strong>Default</strong>, remove your custom profile picture, background cover photo, phone, city, and website, reset capacity/MOQ and company name to defaults, and clear browser-saved quotes and orders. Your login email and password will stay active.
          </>
        }
        onResetAccount={onResetAccount}
        onDeleteAccount={onDeleteAccount}
      />
    </div>
  );
}
