"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Moon,
  ShieldAlert,
  Sparkles,
  Sun,
  Trash2,
  RotateCcw,
  X,
} from "lucide-react";
import { changeUserPassword, sendUserPasswordReset } from "@/lib/auth";
import type { BuyerTheme } from "@/types/user";

export const WORKSPACE_THEME_CHOICES: {
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

export function getDisplayInitials(name: string, fallback = "US"): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ThemeSettingsSection({
  sectionId,
  roleTitle,
  theme,
  onChangeTheme,
  stepLabel = "02 · THEME COLOUR",
}: {
  sectionId: string;
  roleTitle: "Buyer" | "Factory" | "Admin";
  theme: BuyerTheme;
  onChangeTheme: (nextTheme: BuyerTheme) => Promise<void> | void;
  stepLabel?: string;
}) {
  const [themeMessage, setThemeMessage] = useState("");
  const roleLower = roleTitle.toLowerCase();
  const surfaceLabel = roleTitle === "Admin" ? "Admin Portal" : `${roleTitle} Dashboard`;

  async function handleSelectTheme(nextTheme: BuyerTheme) {
    setThemeMessage("");
    await onChangeTheme(nextTheme);
    const label = WORKSPACE_THEME_CHOICES.find((choice) => choice.id === nextTheme)?.label || nextTheme;
    setThemeMessage(`${label} theme applied to your ${surfaceLabel}.`);
  }

  return (
    <section id={sectionId} className="workspace-panel buyer-settings-panel">
      <div className="buyer-settings-panel-header">
        <div>
          <span className="workspace-eyebrow">{stepLabel}</span>
          <h3>Appearance &amp; Theme Mode</h3>
          <p>Choose how your {surfaceLabel} looks. Changes apply instantly across your {roleLower} workspace.</p>
        </div>
      </div>

      <div className="buyer-theme-grid" role="radiogroup" aria-label={`${roleTitle} dashboard theme`}>
        {WORKSPACE_THEME_CHOICES.map((choice) => {
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
  );
}

export function AccountSettingsSection({
  sectionId,
  email,
  roleLabel,
  stepLabel = "03 · ACCOUNT SETTINGS",
  resetDescription,
  resetModalSummary,
  onResetAccount,
  onDeleteAccount,
}: {
  sectionId: string;
  email: string;
  roleLabel: "buyer" | "factory" | "admin";
  stepLabel?: string;
  resetDescription: string;
  resetModalSummary: React.ReactNode;
  onResetAccount: () => Promise<string>;
  onDeleteAccount: (password: string) => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [resetEmailSending, setResetEmailSending] = useState(false);
  const [resetEmailMessage, setResetEmailMessage] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");

  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingAccount, setResettingAccount] = useState(false);
  const [accountActionMessage, setAccountActionMessage] = useState("");
  const [accountActionError, setAccountActionError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
      const msg = await changeUserPassword(email, currentPassword, newPassword);
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
      const msg = await sendUserPasswordReset(email);
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
    <>
      <section id={sectionId} className="workspace-panel buyer-settings-panel">
        <div className="buyer-settings-panel-header">
          <div>
            <span className="workspace-eyebrow">{stepLabel}</span>
            <h3>Password, Recovery &amp; Account Lifecycle</h3>
            <p>Update your login password, trigger a Firebase reset email, or reset and delete your {roleLabel} account.</p>
          </div>
        </div>

        <div className="buyer-account-grid">
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

          <div className="buyer-account-actions-col">
            <div className="buyer-account-subcard">
              <div className="subcard-title">
                <span className="subcard-icon"><Mail size={17} /></span>
                <div>
                  <h4>Reset password</h4>
                  <p>Send a Firebase password reset link directly to <strong>{email}</strong>.</p>
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

            <div className="buyer-account-subcard buyer-warning-card">
              <div className="subcard-title">
                <span className="subcard-icon warning-icon"><RotateCcw size={17} /></span>
                <div>
                  <h4>Reset your account</h4>
                  <p>{resetDescription}</p>
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

            <div className="buyer-account-subcard buyer-danger-card">
              <div className="subcard-title">
                <span className="subcard-icon danger-icon"><Trash2 size={17} /></span>
                <div>
                  <h4>Delete account</h4>
                  <p>
                    Permanently delete your {roleLabel} profile, local credentials, and Firebase Authentication login. This action cannot be undone.
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
            <h2 id="reset-account-title">Reset your {roleLabel} account?</h2>
            <p>{resetModalSummary}</p>
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
            <h2 id="delete-account-title">Delete {roleLabel} account permanently?</h2>
            <p>
              This permanently removes your account (<strong>{email}</strong>), profile details, and saved data. To proceed, confirm below.
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
    </>
  );
}
