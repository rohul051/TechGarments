"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellOff,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Globe,
  LockKeyhole,
  Mail,
  Palette,
  Percent,
  Phone,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { ADMIN_ROLE_OPTIONS } from "@/lib/adminSettings";
import { compressProfilePicture, normalizeWebsiteUrl } from "@/lib/buyerSettings";
import type { AdminPlatformSettings, AdminProfileDetails, AdminRole } from "@/types/user";
import {
  AccountSettingsSection,
  getDisplayInitials,
  ThemeSettingsSection,
} from "@/components/dashboard/WorkspaceSettingsSections";
import { useAdminData } from "./AdminDataContext";

export function AdminSettingsPage() {
  const router = useRouter();
  const {
    adminProfile,
    adminTheme,
    platformSettings,
    saveAdminProfile,
    changeAdminTheme,
    updatePlatformSettings,
    clearVerificationOverrides,
    clearReadNotifications,
    resetAdminAccount,
    deleteAdminAccount,
  } = useAdminData();

  const [prevProfile, setPrevProfile] = useState(adminProfile);
  const [draft, setDraft] = useState<AdminProfileDetails>(adminProfile);
  if (prevProfile !== adminProfile) {
    setPrevProfile(adminProfile);
    setDraft(adminProfile);
  }

  const [prevPlatform, setPrevPlatform] = useState(platformSettings);
  const [platformDraft, setPlatformDraft] = useState<AdminPlatformSettings>(platformSettings);
  if (prevPlatform !== platformSettings) {
    setPrevPlatform(platformSettings);
    setPlatformDraft(platformSettings);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoBusy, setPhotoBusy] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [platformMessage, setPlatformMessage] = useState("");
  const [platformError, setPlatformError] = useState("");
  const [cacheMessage, setCacheMessage] = useState("");

  const hasPhoto = Boolean(draft.photoURL?.trim());

  function updateField<K extends keyof AdminProfileDetails>(
    field: K,
    value: AdminProfileDetails[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setProfileMessage("");
    setProfileError("");
  }

  async function handlePictureSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || photoBusy) return;

    setPhotoBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const compressedDataUrl = await compressProfilePicture(file);
      const nextProfile: AdminProfileDetails = { ...draft, photoURL: compressedDataUrl };
      setDraft(nextProfile);
      await saveAdminProfile(nextProfile);
      setProfileMessage(
        hasPhoto
          ? "Admin profile picture updated."
          : "Profile picture added to your administrator account.",
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
      const nextProfile: AdminProfileDetails = { ...draft, photoURL: "" };
      setDraft(nextProfile);
      await saveAdminProfile(nextProfile);
      setProfileMessage("Admin profile picture removed.");
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
    const cleanDepartment = draft.department.trim() || "TechGarments Executive";
    const cleanPhone = draft.phone.trim();

    if (cleanName.length < 2) {
      setProfileError("Please enter a valid display name (at least 2 characters).");
      return;
    }

    const urlCheck = normalizeWebsiteUrl(draft.website);
    if (!urlCheck.valid) {
      setProfileError(urlCheck.error || "Please enter a valid portal website URL.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const nextProfile: AdminProfileDetails = {
        ...draft,
        fullName: cleanName,
        department: cleanDepartment,
        phone: cleanPhone,
        website: urlCheck.value,
      };
      const resultMessage = await saveAdminProfile(nextProfile);
      setDraft(nextProfile);
      setProfileMessage(resultMessage);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to save admin profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  function handleSavePlatformControls(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlatformError("");
    setPlatformMessage("");

    const rate = Number(platformDraft.commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 35) {
      setPlatformError("Platform commission rate must be between 0% and 35%.");
      return;
    }

    const saved = updatePlatformSettings({
      ...platformDraft,
      commissionRate: rate,
    });
    setPlatformDraft(saved);
    setPlatformMessage(
      `Platform controls saved (${saved.commissionRate}% commission rate · ${saved.defaultCurrency}).`,
    );
  }

  async function handleDeleteAdminAccount(password: string) {
    await deleteAdminAccount(password);
    router.push("/login");
  }

  return (
    <div className="buyer-settings-stack admin-settings-stack">
      <nav className="buyer-settings-nav" aria-label="Admin settings sections">
        <a href="#admin-profile-settings"><UserRound size={15} /> Profile Settings</a>
        <a href="#admin-theme-settings"><Palette size={15} /> Theme Colour</a>
        <a href="#admin-platform-settings"><SlidersHorizontal size={15} /> Platform Controls</a>
        <a href="#admin-account-settings"><LockKeyhole size={15} /> Account Settings</a>
      </nav>

      {/* 1. PROFILE SETTINGS */}
      <section id="admin-profile-settings" className="workspace-panel buyer-settings-panel">
        <div className="buyer-settings-panel-header">
          <div>
            <span className="workspace-eyebrow">01 · PROFILE SETTINGS</span>
            <h3>Administrator Identity &amp; Workspace Details</h3>
            <p>
              Manage your administrator name, profile photo, role badge, contact details, and console preferences.
            </p>
          </div>
        </div>

        <div className="buyer-avatar-editor">
          <div className="buyer-avatar-preview" aria-label="Admin profile picture preview">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.photoURL} alt={draft.fullName || "Administrator"} />
            ) : (
              <span>{getDisplayInitials(draft.fullName || "Super Admin", "SA")}</span>
            )}
          </div>

          <div className="buyer-avatar-controls">
            <h4>{hasPhoto ? "Administrator profile picture" : "No profile picture added yet"}</h4>
            <p>Displayed in the Admin Portal top bar and sidebar footer (PNG, JPG, or WebP).</p>
            <div className="buyer-avatar-buttons">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                aria-label={hasPhoto ? "Change profile picture" : "Add profile picture"}
                onChange={(e) => void handlePictureSelected(e)}
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

        <form className="buyer-settings-form" onSubmit={(e) => void handleSaveProfile(e)} noValidate>
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
                  placeholder="e.g. Super Administrator"
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
              <span>Organization / Department *</span>
              <div className="buyer-input-icon">
                <Building2 size={15} />
                <input
                  type="text"
                  required
                  value={draft.department}
                  onChange={(e) => updateField("department", e.target.value)}
                  placeholder="e.g. TechGarments Executive"
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Admin Role Designation *</span>
              <div className="buyer-input-icon">
                <Shield size={15} />
                <select
                  value={draft.adminRole}
                  onChange={(e) => updateField("adminRole", e.target.value as AdminRole)}
                >
                  {ADMIN_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="workspace-field field-full">
              <span>Portal / Support Web URL</span>
              <div className="buyer-input-icon">
                <Globe size={15} />
                <input
                  type="url"
                  value={draft.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://admin.techgarments.com"
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
              <Mail size={14} /> Signed-in Admin Email: <strong>{draft.email}</strong>
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
        sectionId="admin-theme-settings"
        roleTitle="Admin"
        theme={adminTheme}
        onChangeTheme={changeAdminTheme}
      />

      {/* 3. PLATFORM GOVERNANCE & FEE CONTROLS */}
      <section id="admin-platform-settings" className="workspace-panel buyer-settings-panel">
        <div className="buyer-settings-panel-header">
          <div>
            <span className="workspace-eyebrow">03 · PLATFORM CONTROLS</span>
            <h3>Marketplace Fees, Verification &amp; Operations</h3>
            <p>
              Configure live calculations across Admin KPIs, factory verification rules, and portal-wide notices.
            </p>
          </div>
        </div>

        <form className="buyer-settings-form" onSubmit={handleSavePlatformControls} noValidate>
          <div className="request-form-grid">
            <label className="workspace-field">
              <span>Platform Commission Rate (%) *</span>
              <div className="buyer-input-icon">
                <Percent size={15} />
                <input
                  type="number"
                  min={0}
                  max={35}
                  step={0.5}
                  value={platformDraft.commissionRate}
                  onChange={(e) => {
                    setPlatformDraft((curr) => ({
                      ...curr,
                      commissionRate: Number(e.target.value),
                    }));
                    setPlatformMessage("");
                    setPlatformError("");
                  }}
                />
              </div>
            </label>

            <label className="workspace-field">
              <span>Default Reporting Currency</span>
              <select
                value={platformDraft.defaultCurrency}
                onChange={(e) => {
                  setPlatformDraft((curr) => ({
                    ...curr,
                    defaultCurrency: e.target.value as AdminPlatformSettings["defaultCurrency"],
                  }));
                  setPlatformMessage("");
                  setPlatformError("");
                }}
              >
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
              </select>
            </label>

            <label className="workspace-field field-full">
              <span>Admin Portal Announcement / Maintenance Banner</span>
              <input
                type="text"
                value={platformDraft.maintenanceBanner}
                onChange={(e) => {
                  setPlatformDraft((curr) => ({
                    ...curr,
                    maintenanceBanner: e.target.value,
                  }));
                  setPlatformMessage("");
                  setPlatformError("");
                }}
                placeholder="Optional notice displayed at the top of Admin Portal pages (leave blank to hide)"
              />
            </label>
          </div>

          <label className="mt-4 flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer admin-control-toggle">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#16A36A] cursor-pointer"
              checked={platformDraft.autoVerifyCompleteFactories}
              onChange={(e) => {
                setPlatformDraft((curr) => ({
                  ...curr,
                  autoVerifyCompleteFactories: e.target.checked,
                }));
                setPlatformMessage("");
                setPlatformError("");
              }}
            />
            <div>
              <span className="block text-xs font-semibold text-[#102B46] admin-control-title">
                Auto-verify factories with complete production profiles
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Factories that specify company name, country, monthly capacity, and product categories are automatically marked Verified unless manually overridden.
              </span>
            </div>
          </label>

          {platformError && (
            <div className="profile-edit-error" role="alert">
              {platformError}
            </div>
          )}
          {platformMessage && (
            <div className="profile-save-message" role="status">
              <CheckCircle2 size={16} />
              <span>{platformMessage}</span>
            </div>
          )}

          <div className="buyer-settings-footer">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  clearVerificationOverrides();
                  setCacheMessage("Manual factory verification overrides cleared.");
                }}
              >
                <RotateCcw size={13} /> Clear verification overrides
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  clearReadNotifications();
                  setCacheMessage("All Admin notifications marked unread again.");
                }}
              >
                <BellOff size={13} /> Reset unread alerts
              </button>
            </div>
            <button type="submit" className="workspace-primary-button">
              Save Platform Controls <Check size={15} />
            </button>
          </div>

          {cacheMessage && (
            <div className="profile-save-message mt-3" role="status">
              <CheckCircle2 size={16} />
              <span>{cacheMessage}</span>
            </div>
          )}
        </form>
      </section>

      {/* 4. ACCOUNT SETTINGS */}
      <AccountSettingsSection
        sectionId="admin-account-settings"
        email={draft.email}
        roleLabel="admin"
        stepLabel="04 · ACCOUNT SETTINGS"
        resetDescription="Restore your admin profile, theme colour to Default, platform controls (5% fee), and alert/verification caches while keeping your login active."
        resetModalSummary={
          <>
            This restores your administrator settings to clean defaults: sets Theme colour back to{" "}
            <strong>Default</strong>, clears custom avatar, phone, and website, restores{" "}
            <strong>5%</strong> platform commission, and resets verification/notification local overrides.
            Your admin login email and password remain active.
          </>
        }
        onResetAccount={resetAdminAccount}
        onDeleteAccount={handleDeleteAdminAccount}
      />
    </div>
  );
}
