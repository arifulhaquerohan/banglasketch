"use client";

import { useEffect, useState } from "react";
import { FiShield, FiKey, FiAlertCircle, FiCheckCircle, FiUserPlus, FiActivity } from "react-icons/fi";
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
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    display_name: "",
    password: "",
    role: "viewer",
  });

  // 2FA states
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauth: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpMsg, setTotpMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    const [u, a] = await Promise.all([
      adminFetch<User[]>("users"),
      adminFetch<Audit[]>("audit?limit=50"),
    ]);
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
    const result = await adminFetch<{ secret: string; otpauth: string }>("2fa/setup", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (result.success && result.data) setTotpSetup(result.data);
    else setTotpMsg({ text: result.error || "Failed to generate 2FA secret", type: "error" });
  };

  const enable2fa = async () => {
    if (!totpCode || !/^\d{6}$/.test(totpCode)) {
      setTotpMsg({
        text: "Please enter the 6-digit code from your authenticator app.",
        type: "error",
      });
      return;
    }
    setTotpLoading(true);
    setTotpMsg(null);
    const result = await adminFetch("2fa/enable", {
      method: "POST",
      body: JSON.stringify({ code: totpCode }),
    });
    setTotpLoading(false);
    if (result.success) {
      setTotpMsg({
        text: "Two-factor authentication enabled successfully. You will be redirected shortly.",
        type: "success",
      });
      setTotpSetup(null);
      setTotpCode("");
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } else {
      setTotpMsg({ text: result.error || "Invalid verification code", type: "error" });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">
          Security & Access Audit
        </h1>
        <p className="text-sm text-[#5A625A] mt-1">
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
      <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] text-[#586348] flex items-center justify-center shadow-xs">
              <FiShield size={22} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#242824]">Two-Factor Authentication (2FA)</h2>
              <p className="text-xs text-[#5A625A] mt-0.5">
                Strengthen administrator session security with time-based one-time passwords (TOTP).
              </p>
            </div>
          </div>
          {!totpSetup && (
            <button
              onClick={setup2fa}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
              disabled={totpLoading}
            >
              <FiKey size={14} /> Configure 2FA
            </button>
          )}
        </div>

        {totpSetup ? (
          <div className="space-y-4 border border-[#DED5C7] rounded-2xl bg-white p-6">
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1">
                Secret Key
              </label>
              <div className="font-mono text-xs text-[#242824] bg-[#F5F2EB] px-3.5 py-2.5 rounded-xl border border-[#DED5C7] break-all">
                {totpSetup.secret}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1">
                Authenticator URI (Scan QR / Manual Input)
              </label>
              <div className="font-mono text-xs text-[#5A625A] bg-[#F5F2EB] px-3.5 py-2.5 rounded-xl border border-[#DED5C7] break-all">
                {totpSetup.otpauth}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="bg-[#FCFAF7] border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] font-mono tracking-widest text-center w-48 focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20"
              />
              <button
                onClick={enable2fa}
                disabled={totpLoading || !totpCode}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <FiCheckCircle size={14} /> Confirm & Enable
              </button>
            </div>
            <p className="text-xs text-[#737D73] leading-relaxed">
              Open Google Authenticator, Authy, or your preferred authenticator app, register the secret key above, and enter the generated 6-digit code.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#5A625A] bg-[#F5F2EB] border border-[#DED5C7] px-4 py-3 rounded-xl">
            <FiAlertCircle size={14} className="text-[#586348]" />
            <span>Click &ldquo;Configure 2FA&rdquo; to begin the authenticator setup process for this account.</span>
          </div>
        )}
      </div>

      {/* Add Staff User Form */}
      <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <FiUserPlus size={18} className="text-[#586348]" />
          <h2 className="font-serif text-lg font-bold text-[#242824]">Provision Administrator Account</h2>
        </div>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            required
            placeholder="Full Name"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            className="bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20"
          />
          <input
            required
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20"
          />
          <input
            required
            minLength={12}
            type="password"
            placeholder="Temporary Password (min 12)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20"
          >
            <option value="viewer">Viewer (Read-only)</option>
            <option value="editor">Editor (Studio Content)</option>
            <option value="admin">Admin (Full Management)</option>
            <option value="owner">Owner (Studio Principal)</option>
          </select>
          <button
            type="submit"
            className="bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <FiUserPlus size={14} /> Add User
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-[#DED5C7]">
          <h2 className="font-serif text-lg font-bold text-[#242824]">Authorized Studio Personnel</h2>
          <p className="text-xs text-[#5A625A] mt-0.5">Active and provisioned administrative users with CMS roles.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[#586348] bg-[#F5F2EB] border-b border-[#DED5C7]">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">2FA</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DED5C7] bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-[#242824]">{user.display_name}</div>
                    <div className="text-xs text-[#5A625A] font-mono mt-0.5">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-xs font-semibold px-2.5 py-1 bg-[#F5F2EB] text-[#242824] rounded-lg border border-[#DED5C7]">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.totp_enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <FiCheckCircle size={12} /> Enabled
                      </span>
                    ) : (
                      <span className="text-xs text-[#8C948C]">Disabled</span>
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
                          : "border-[#586348]/30 text-[#586348] hover:bg-[#EDF1EA]"
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
      <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <FiActivity size={18} className="text-[#586348]" />
          <h2 className="font-serif text-lg font-bold text-[#242824]">Recent Audit Activity</h2>
        </div>
        <p className="text-xs text-[#5A625A]">Chronological record of sensitive actions, logins, and project modifications.</p>

        <div className="space-y-2 pt-2">
          {audit.length === 0 ? (
            <p className="text-xs text-[#8C948C] italic">No audit records found.</p>
          ) : (
            audit.map((row) => (
              <div
                key={row.id}
                className="text-xs border-b border-[#DED5C7] last:border-0 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div className="space-x-1.5">
                  <span className="font-mono font-semibold text-[#586348]">{row.actor_email || "system"}</span>
                  <span className="text-[#242824] font-medium">{row.action}</span>
                  {row.entity_type && <span className="text-[#5A625A]">({row.entity_type} {row.entity_id})</span>}
                </div>
                <time className="text-[#737D73] text-[11px] tabular-nums shrink-0">
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
