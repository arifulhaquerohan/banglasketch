"use client";

import { useEffect, useState } from "react";
import {
  FiShield,
  FiKey,
  FiAlertCircle,
  FiCheckCircle,
  FiUserPlus,
  FiActivity,
  FiCopy,
  FiCheck,
  FiX,
  FiUnlock,
} from "react-icons/fi";
import { adminFetch } from "@/lib/api";

type User = {
  id: number;
  email: string;
  display_name: string;
  role: string;
  active: boolean;
  totp_enabled: boolean;
  last_login_at?: string;
};

type Audit = {
  id: number;
  actor_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
};

export default function SecurityPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    display_name: "",
    password: "",
    role: "viewer",
  });

  // 2FA setup states
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauth: string; qrCode?: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpMsg, setTotpMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // 2FA disable modal/states
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableTotpCode, setDisableTotpCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  const load = async () => {
    const [p, u, a] = await Promise.all([
      adminFetch<User>("profile"),
      adminFetch<User[]>("users"),
      adminFetch<Audit[]>("audit?limit=50"),
    ]);
    if (p.success && p.data) setCurrentUser(p.data);
    if (u.success) setUsers(u.data || []);
    else setError(u.error || "Unable to load users");
    if (a.success) setAudit(a.data || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await adminFetch("users", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (!result.success) return setError(result.error || "Unable to add user");
    setForm({ email: "", display_name: "", password: "", role: "viewer" });
    await load();
  };

  const toggle = async (user: User) => {
    const result = await adminFetch(`users/${user.id}/status`, {
      method: "PUT",
      body: JSON.stringify({ active: !user.active }),
    });
    if (!result.success) setError(result.error || "Unable to update user");
    else await load();
  };

  const setup2fa = async () => {
    setTotpSetup(null);
    setTotpMsg(null);
    setTotpLoading(true);
    const result = await adminFetch<{ secret: string; otpauth?: string; qrCode?: string }>("2fa/setup", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setTotpLoading(false);
    if (result.success && result.data) {
      const otpauth = result.data.otpauth || result.data.qrCode || "";
      setTotpSetup({ secret: result.data.secret, otpauth, qrCode: result.data.qrCode });
    } else {
      setTotpMsg({ text: result.error || "Failed to generate 2FA secret", type: "error" });
    }
  };

  const enable2fa = async () => {
    const cleaned = totpCode.replace(/\D/g, "");
    if (!cleaned || cleaned.length !== 6) {
      setTotpMsg({
        text: "Please enter the 6-digit code from your authenticator app.",
        type: "error",
      });
      return;
    }
    setTotpLoading(true);
    setTotpMsg(null);
    const result = await adminFetch("2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code: cleaned, totp: cleaned }),
    });
    setTotpLoading(false);
    if (result.success) {
      setTotpMsg({
        text: "Two-factor authentication enabled successfully! Your account is now secured.",
        type: "success",
      });
      setTotpSetup(null);
      setTotpCode("");
      await load();
    } else {
      setTotpMsg({ text: result.error || "Invalid verification code. Check your device time and try again.", type: "error" });
    }
  };

  const disable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword.trim() && !disableTotpCode.trim()) {
      setTotpMsg({ text: "Please enter your current password or 2FA code to confirm.", type: "error" });
      return;
    }
    setDisableLoading(true);
    setTotpMsg(null);
    const result = await adminFetch("2fa/disable", {
      method: "POST",
      body: JSON.stringify({
        password: disablePassword || undefined,
        code: disableTotpCode.replace(/\D/g, "") || undefined,
      }),
    });
    setDisableLoading(false);
    if (result.success) {
      setDisableModalOpen(false);
      setDisablePassword("");
      setDisableTotpCode("");
      setTotpMsg({ text: "Two-factor authentication has been disabled.", type: "success" });
      await load();
    } else {
      setTotpMsg({ text: result.error || "Failed to disable 2FA. Check your credentials.", type: "error" });
    }
  };

  const copySecret = () => {
    if (!totpSetup?.secret) return;
    navigator.clipboard.writeText(totpSetup.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const isCurrent2faActive = Boolean(currentUser?.totp_enabled);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-admin-ink tracking-tight">
          Security & Access Audit
        </h1>
        <p className="text-sm text-admin-muted mt-1">
          Manage architectural staff credentials, enforce two-factor authentication, and monitor operational audit logs.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <FiAlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {totpMsg && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-3 rounded-2xl border ${
            totpMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {totpMsg.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
          <span>{totpMsg.text}</span>
        </div>
      )}

      {/* 2FA Section */}
      <div className="bg-admin-surface border border-admin-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs ${
              isCurrent2faActive
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-[#EDF1EA] border-[#D5DEC4] text-admin-primary"
            }`}>
              <FiShield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-admin-ink">Two-Factor Authentication (2FA)</h2>
                {isCurrent2faActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <FiCheckCircle size={12} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-admin-muted bg-admin-canvas border border-admin-border px-2 py-0.5 rounded-full">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-admin-muted mt-0.5">
                {isCurrent2faActive
                  ? "Your administrator account is protected with TOTP one-time passwords."
                  : "Strengthen administrator session security with time-based one-time passwords (TOTP)."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isCurrent2faActive ? (
              <button
                type="button"
                onClick={() => setDisableModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <FiUnlock size={14} /> Disable 2FA
              </button>
            ) : (
              !totpSetup && (
                <button
                  type="button"
                  onClick={setup2fa}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-admin-ink hover:bg-admin-elevated text-admin-surface rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  disabled={totpLoading}
                >
                  <FiKey size={14} /> Configure 2FA
                </button>
              )
            )}
          </div>
        </div>

        {/* Setup Card */}
        {totpSetup && !isCurrent2faActive && (
          <div className="space-y-4 border border-admin-border rounded-2xl bg-white p-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-admin-ink flex items-center gap-2">
                <FiKey className="text-admin-primary" size={15} /> Authenticator Setup
              </h3>
              <button
                type="button"
                onClick={() => setTotpSetup(null)}
                className="text-admin-muted hover:text-admin-ink p-1 rounded-lg hover:bg-admin-canvas"
                title="Cancel setup"
              >
                <FiX size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-admin-primary uppercase tracking-wider mb-1">
                1. Secret Key (Manual Entry)
              </label>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs text-admin-ink bg-admin-canvas px-3.5 py-2.5 rounded-xl border border-admin-border flex-1 select-all tracking-wider">
                  {totpSetup.secret}
                </div>
                <button
                  type="button"
                  onClick={copySecret}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-admin-canvas hover:bg-admin-border/50 border border-admin-border rounded-xl text-xs font-semibold text-admin-ink transition-colors"
                >
                  {copiedSecret ? (
                    <>
                      <FiCheck className="text-emerald-600" size={14} />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <FiCopy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-admin-primary uppercase tracking-wider mb-1">
                2. Authenticator URI
              </label>
              <div className="font-mono text-[11px] text-admin-muted bg-admin-canvas px-3.5 py-2.5 rounded-xl border border-admin-border break-all select-all">
                {totpSetup.otpauth}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-admin-primary uppercase tracking-wider mb-1">
                3. Enter 6-Digit Code from App
              </label>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-base text-admin-ink font-mono tracking-widest text-center w-40 focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && totpCode.length === 6) {
                      e.preventDefault();
                      enable2fa();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={enable2fa}
                  disabled={totpLoading || totpCode.length !== 6}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-admin-primary hover:bg-admin-hover text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  <FiCheckCircle size={14} /> {totpLoading ? "Verifying..." : "Confirm & Enable 2FA"}
                </button>
              </div>
            </div>

            <p className="text-xs text-admin-subtle leading-relaxed">
              Open Google Authenticator, Microsoft Authenticator, Authy, or 1Password, add account by entering the secret key, and enter the generated 6-digit code.
            </p>
          </div>
        )}

        {!totpSetup && !isCurrent2faActive && (
          <div className="flex items-center gap-2 text-xs text-admin-muted bg-admin-canvas border border-admin-border px-4 py-3 rounded-xl">
            <FiAlertCircle size={14} className="text-admin-primary" />
            <span>Click &ldquo;Configure 2FA&rdquo; to begin the authenticator setup process for this account.</span>
          </div>
        )}
      </div>

      {/* Disable 2FA Modal */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-admin-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-700">
                <FiUnlock size={20} />
                <h3 className="font-serif text-lg font-bold text-admin-ink">Disable Two-Factor Authentication</h3>
              </div>
              <button
                type="button"
                onClick={() => setDisableModalOpen(false)}
                className="text-admin-muted hover:text-admin-ink p-1 rounded-lg hover:bg-admin-canvas"
              >
                <FiX size={18} />
              </button>
            </div>

            <p className="text-xs text-admin-muted leading-relaxed">
              Disabling 2FA reduces account security. Please enter your administrator password or current 6-digit TOTP code to confirm.
            </p>

            <form onSubmit={disable2fa} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-admin-ink mb-1">Admin Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full bg-admin-canvas border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-ink focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
                />
              </div>

              <div className="text-center text-xs text-admin-muted py-0.5">— OR —</div>

              <div>
                <label className="block text-xs font-semibold text-admin-ink mb-1">Current 6-Digit 2FA Code</label>
                <input
                  inputMode="numeric"
                  value={disableTotpCode}
                  onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-admin-canvas border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-ink font-mono tracking-widest text-center focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-admin-muted hover:text-admin-ink rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableLoading || (!disablePassword && disableTotpCode.length !== 6)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {disableLoading ? "Disabling..." : "Confirm Disable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff User Form */}
      <div className="bg-admin-surface border border-admin-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <FiUserPlus size={18} className="text-admin-primary" />
          <h2 className="font-serif text-lg font-bold text-admin-ink">Provision Administrator Account</h2>
        </div>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            required
            placeholder="Full Name"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            className="bg-white border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-ink placeholder:text-admin-subtle focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
          />
          <input
            required
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-white border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-ink placeholder:text-admin-subtle focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
          />
          <input
            required
            minLength={12}
            type="password"
            placeholder="Temporary Password (min 12)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="bg-white border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-ink placeholder:text-admin-subtle focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="bg-white border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-ink focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
          >
            <option value="viewer">Viewer (Read-only)</option>
            <option value="editor">Editor (Studio Content)</option>
            <option value="admin">Admin (Full Management)</option>
            <option value="owner">Owner (Studio Principal)</option>
          </select>
          <button
            type="submit"
            className="bg-admin-ink hover:bg-admin-elevated text-admin-surface rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <FiUserPlus size={14} /> Add User
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-admin-surface border border-admin-border rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-admin-border">
          <h2 className="font-serif text-lg font-bold text-admin-ink">Authorized Studio Personnel</h2>
          <p className="text-xs text-admin-muted mt-0.5">Active and provisioned administrative users with CMS roles.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-admin-primary bg-admin-canvas border-b border-admin-border">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">2FA</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-admin-canvas/50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-admin-ink">{user.display_name}</div>
                    <div className="text-xs text-admin-muted font-mono mt-0.5">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-xs font-semibold px-2.5 py-1 bg-admin-canvas text-admin-ink rounded-lg border border-admin-border">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.totp_enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <FiCheckCircle size={12} /> Enabled
                      </span>
                    ) : (
                      <span className="text-xs text-admin-subtle">Disabled</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        user.active
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {user.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggle(user)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                        user.active
                          ? "border-red-200 text-red-700 hover:bg-red-50"
                          : "border-admin-primary/30 text-admin-primary hover:bg-[#EDF1EA]"
                      }`}
                    >
                      {user.active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Activity */}
      <div className="bg-admin-surface border border-admin-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <FiActivity size={18} className="text-admin-primary" />
          <h2 className="font-serif text-lg font-bold text-admin-ink">Recent Audit Activity</h2>
        </div>
        <p className="text-xs text-admin-muted">Chronological record of sensitive actions, logins, and project modifications.</p>

        <div className="space-y-2 pt-2">
          {audit.length === 0 ? (
            <p className="text-xs text-admin-subtle italic">No audit records found.</p>
          ) : (
            audit.map((row) => (
              <div
                key={row.id}
                className="text-xs border-b border-admin-border last:border-0 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div className="space-x-1.5">
                  <span className="font-mono font-semibold text-admin-primary">{row.actor_email || "system"}</span>
                  <span className="text-admin-ink font-medium">{row.action}</span>
                  {row.entity_type && <span className="text-admin-muted">({row.entity_type} {row.entity_id})</span>}
                </div>
                <time className="text-admin-subtle text-[11px] tabular-nums shrink-0">
                  {new Date(row.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
