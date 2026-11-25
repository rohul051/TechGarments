"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  Palette,
  Phone,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { changeUserPassword, sendUserPasswordReset } from "@/lib/auth";
import {
  BUYER_TYPE_OPTIONS,
  compressProfilePicture,
  normalizeWebsiteUrl,
} from "@/lib/buyerSettings";
import type { BuyerProfileDetails, BuyerTheme } from "@/types/user";

interface BuyerSettingsPageProps {
  profile: BuyerProfileDetails;
  theme: BuyerTheme;
  onSaveProfile: (nextProfile: BuyerProfileDetails) => Promise<string>;
  onChangeTheme: (nextTheme: BuyerTheme) => Promise<void> | void;
  onResetAccount: () => Promise<string>;
  onDeleteAccount: (password: string) => Promise<void>;
}

const themeChoices: {
  id: BuyerTheme;
  label: string;
  description: string;
  swatchBg: string;
  swatchCard: string;
  swatchAccent: string;
  icon: typeof Sparkles;
}[] = [
  {
    id: "default",
    label: "Default",
    description: "Classic Threadline slate canvas with signature teal accents.",
    swatchBg: "#f7f9fa",
    swatchCard: "#ffffff",
    swatchAccent: "#168a83",
    icon: Sparkles,
  },
  {
    id: "light",
    label: "Light",
    description: "Bright crisp daylight surfaces with emerald green accents.",
    swatchBg: "#eef2f6",
    swatchCard: "#ffffff",
    swatchAccent: "#16a36a",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Low-glare midnight navy workspace designed for night work.",
    swatchBg: "#0b1622",
    swatchCard: "#132334",
    swatchAccent: "#2dd4bf",
    icon: Moon,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "BU";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
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

  // Theme status
  const [themeMessage, setThemeMessage] = useState("");

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Reset Password states
  const [resetEmailSending, setResetEmailSending] = useState(false);
  const [resetEmailMessage, setResetEmailMessage] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");

  // Reset Account Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingAccount, setResettingAccount] = useState(false);
  const [accountActionMessage, setAccountActionMessage] = useState("");
  const [accountActionError, setAccountActionError] = useState("");

  // Delete Account Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  async function handleSelectTheme(nextTheme: BuyerTheme) {
    setThemeMessage("");
    await onChangeTheme(nextTheme);
    const label = themeChoices.find((choice) => choice.id === nextTheme)?.label || nextTheme;
    setThemeMessage(`${label} theme applied to your Buyer Dashboard.`);
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordSaving) return;

    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const msg = await changeUserPassword(profile.email, currentPassword, newPassword);
      setPasswordMessage(msg);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Could not change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSendResetEmail() {
    if (resetEmailSending) return;
    setResetEmailSending(true);
    setResetEmailError("");
    setResetEmailMessage("");
    try {
      const msg = await sendUserPasswordReset(profile.email);
      setResetEmailMessage(msg);
    } catch (error) {
      setResetEmailError(error instanceof Error ? error.message : "Could not send reset email.");
    } finally {
      setResetEmailSending(false);
    }
  }

  async function handleConfirmResetAccount() {
    if (resettingAccount) return;
    setResettingAccount(true);
    setAccountActionError("");
    setAccountActionMessage("");
    try {
      const msg = await onResetAccount();
      setShowResetModal(false);
      setAccountActionMessage(msg);
    } catch (error) {
      setAccountActionError(error instanceof Error ? error.message : "Could not reset account.");
    } finally {
      setResettingAccount(false);
    }
  }

  async function handleConfirmDeleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deletingAccount) return;

    setDeleteError("");
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      setDeleteError('Type "DELETE" exactly to confirm permanent account removal.');
      return;
    }
    if (!deletePassword) {
      setDeleteError("Enter your account password to authorize deletion.");
      return;
    }

    setDeletingAccount(true);
    try {
      await onDeleteAccount(deletePassword);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete account.");
      setDeletingAccount(false);
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
              <span>{getInitials(draft.fullName || "Buyer")}</span>
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
      <section id="buyer-theme-settings" className="workspace-panel buyer-settings-panel">
        <div className="buyer-settings-panel-header">
          <div>
            <span className="workspace-eyebrow">02 · THEME COLOUR</span>
            <h3>Appearance &amp; Theme Mode</h3>
            <p>Choose how your Buyer Dashboard looks. Changes apply instantly to your buyer workspace only.</p>
          </div>
        </div>

        <div className="buyer-theme-grid" role="radiogroup" aria-label="Buyer dashboard theme">
          {themeChoices.map((choice) => {
            const Icon = choice.icon;
            const active = theme === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`buyer-theme-card ${active ? "theme-card-active" : ""}`}
                onClick={() => void handleSelectTheme(choice.id)}
              >
                <div
                  className="buyer-theme-swatch"
                  style={{ background: choice.swatchBg }}
                >
                  <div
                    className="swatch-sidebar"
                    style={{ background: choice.swatchCard }}
                  >
                    <span style={{ background: choice.swatchAccent }} />
                    <span style={{ background: choice.id === "dark" ? "#334155" : "#cbd5e1" }} />
                    <span style={{ background: choice.id === "dark" ? "#334155" : "#e2e8f0" }} />
                  </div>
                  <div className="swatch-main">
                    <div
                      className="swatch-topbar"
                      style={{ background: choice.swatchCard }}
                    />
                    <div className="swatch-cards">
                      <span style={{ background: choice.swatchCard }} />
                      <span style={{ background: choice.swatchCard }} />
                    </div>
                  </div>
                </div>

                <div className="buyer-theme-meta">
                  <div className="buyer-theme-title-row">
                    <span>
                      <Icon size={15} />
                      <strong>{choice.label}</strong>
                    </span>
                    {active && (
                      <span className="theme-active-badge">
                        <Check size={12} /> Active
                      </span>
                    )}
                  </div>
                  <small>{choice.description}</small>
                </div>
              </button>
            );
          })}
        </div>

        {themeMessage && (
          <div className="profile-save-message buyer-theme-feedback" role="status">
            <CheckCircle2 size={16} />
            <span>{themeMessage}</span>
          </div>
        )}
      </section>

      {/* 3. ACCOUNT SETTINGS */}
      <section id="buyer-account-settings" className="workspace-panel buyer-settings-panel">
        <div className="buyer-settings-panel-header">
          <div>
            <span className="workspace-eyebrow">03 · ACCOUNT SETTINGS</span>
            <h3>Password, Recovery &amp; Account Lifecycle</h3>
            <p>Update your login password, trigger a Firebase reset email, or reset and delete your buyer account.</p>
          </div>
        </div>

        <div className="buyer-account-grid">
          {/* Change Password */}
          <div className="buyer-account-subcard">
            <div className="subcard-title">
              <span className="subcard-icon"><KeyRound size={17} /></span>
              <div>
                <h4>Change password</h4>
                <p>Verify your current password to set a new password immediately.</p>
              </div>
            </div>

            <form className="buyer-password-form" onSubmit={handleChangePassword} noValidate>
              <label className="workspace-field">
                <span>Current password</span>
                <div className="buyer-password-wrap">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError("");
                      setPasswordMessage("");
                    }}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              <label className="workspace-field">
                <span>New password (min 6 characters)</span>
                <div className="buyer-password-wrap">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                      setPasswordMessage("");
                    }}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              <label className="workspace-field">
                <span>Confirm new password</span>
                <div className="buyer-password-wrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                      setPasswordMessage("");
                    }}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              {passwordError && (
                <div className="profile-edit-error" role="alert">
                  {passwordError}
                </div>
              )}
              {passwordMessage && (
                <div className="profile-save-message" role="status">
                  <CheckCircle2 size={16} />
                  <span>{passwordMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="workspace-primary-button"
                disabled={passwordSaving}
              >
                {passwordSaving ? "Updating password..." : <>Change password <Check size={15} /></>}
              </button>
            </form>
          </div>

          {/* Reset Password + Reset Account + Delete Account */}
          <div className="buyer-account-actions-col">
            {/* Reset Password */}
            <div className="buyer-account-subcard">
              <div className="subcard-title">
                <span className="subcard-icon"><Mail size={17} /></span>
                <div>
                  <h4>Reset password</h4>
                  <p>Send a Firebase password reset link directly to <strong>{profile.email}</strong>.</p>
                </div>
              </div>
              {resetEmailError && (
                <div className="profile-edit-error" role="alert">
                  {resetEmailError}
                </div>
              )}
              {resetEmailMessage && (
                <div className="profile-save-message" role="status">
                  <CheckCircle2 size={16} />
                  <span>{resetEmailMessage}</span>
                </div>
              )}
              <button
                type="button"
                className="outline-wide-button"
                disabled={resetEmailSending}
                onClick={() => void handleSendResetEmail()}
              >
                {resetEmailSending ? "Sending reset link..." : "Send password reset email"}
              </button>
            </div>

            {/* Reset Your Account */}
            <div className="buyer-account-subcard buyer-warning-card">
              <div className="subcard-title">
                <span className="subcard-icon warning-icon"><RotateCcw size={17} /></span>
                <div>
                  <h4>Reset your account</h4>
                  <p>
                    Restore your buyer workspace to clean defaults (clears saved factories, local requests/orders cache, theme colour, and custom profile photo/company fields while keeping your login).
                  </p>
                </div>
              </div>
              {accountActionError && (
                <div className="profile-edit-error" role="alert">
                  {accountActionError}
                </div>
              )}
              {accountActionMessage && (
                <div className="profile-save-message" role="status">
                  <CheckCircle2 size={16} />
                  <span>{accountActionMessage}</span>
                </div>
              )}
              <button
                type="button"
                className="buyer-warning-button"
                onClick={() => {
                  setAccountActionError("");
                  setAccountActionMessage("");
                  setShowResetModal(true);
                }}
              >
                <RotateCcw size={14} /> Reset your account
              </button>
            </div>

            {/* Delete Account */}
            <div className="buyer-account-subcard buyer-danger-card">
              <div className="subcard-title">
                <span className="subcard-icon danger-icon"><Trash2 size={17} /></span>
                <div>
                  <h4>Delete account</h4>
                  <p>
                    Permanently delete your buyer profile, local credentials, and Firebase Authentication login. This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="buyer-danger-button"
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeletePassword("");
                  setDeleteError("");
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 size={14} /> Delete account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reset Account Confirmation Modal */}
      {showResetModal && (
        <div
          className="workspace-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !resettingAccount) setShowResetModal(false);
          }}
        >
          <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="reset-account-title">
            <button
              type="button"
              className="modal-close"
              aria-label="Close reset confirmation"
              onClick={() => !resettingAccount && setShowResetModal(false)}
            >
              <X size={17} />
            </button>
            <span className="modal-icon modal-icon-warning"><AlertTriangle size={21} /></span>
            <h2 id="reset-account-title">Reset your buyer account?</h2>
            <p>
              This will restore your buyer settings to defaults: reset Theme colour to <strong>Default</strong>, remove your custom profile picture, phone, and website, reset Company Name and Buyer Type to defaults, and clear saved factories and browser-saved requests/orders. Your login email and password will stay active.
            </p>
            {accountActionError && (
              <div className="profile-edit-error" role="alert">
                {accountActionError}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                disabled={resettingAccount}
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="buyer-warning-solid-button"
                disabled={resettingAccount}
                onClick={() => void handleConfirmResetAccount()}
              >
                {resettingAccount ? "Resetting..." : "Confirm reset"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="workspace-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deletingAccount) setShowDeleteModal(false);
          }}
        >
          <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
            <button
              type="button"
              className="modal-close"
              aria-label="Close delete confirmation"
              onClick={() => !deletingAccount && setShowDeleteModal(false)}
            >
              <X size={17} />
            </button>
            <span className="modal-icon modal-icon-danger"><ShieldAlert size={21} /></span>
            <h2 id="delete-account-title">Delete buyer account permanently?</h2>
            <p>
              This permanently removes your account (<strong>{profile.email}</strong>), profile details, and saved data. To proceed, confirm below.
            </p>
            <form className="buyer-delete-confirm-form" onSubmit={handleConfirmDeleteAccount}>
              <label className="workspace-field">
                <span>Type <strong>DELETE</strong> to confirm</span>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value);
                    setDeleteError("");
                  }}
                  placeholder="DELETE"
                  autoComplete="off"
                />
              </label>

              <label className="workspace-field">
                <span>Enter your password</span>
                <div className="buyer-password-wrap">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError("");
                    }}
                    placeholder="Account password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword((v) => !v)}
                    aria-label={showDeletePassword ? "Hide password" : "Show password"}
                  >
                    {showDeletePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              {deleteError && (
                <div className="profile-edit-error" role="alert">
                  {deleteError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="buyer-danger-solid-button"
                  disabled={deletingAccount}
                >
                  {deletingAccount ? "Deleting account..." : "Delete account permanently"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
