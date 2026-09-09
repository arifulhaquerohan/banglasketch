"use client";

import { useState, useEffect } from "react";
import {
  FiSave,
  FiGlobe,
  FiMail,
  FiPhone,
  FiUsers,
  FiTool,
  FiAlertTriangle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiLock,
  FiKey,
} from "react-icons/fi";
import { MaintenanceConfig, DEFAULT_MAINTENANCE_CONFIG } from "../../../lib/maintenance.types";
import { adminFetch } from "../../../lib/api";
import AdminResetPasswordModal from "@/components/admin/AdminResetPasswordModal";

interface GeneralSettings {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  tagline: string;
  language: string;
}

interface ContactSettings {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
}

interface SocialSettings {
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("maintenance");
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [reauthenticating, setReauthenticating] = useState(false);

  // States
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>(DEFAULT_MAINTENANCE_CONFIG);
  const [general, setGeneral] = useState<GeneralSettings>({
    siteName: "Banglasketch",
    siteTitle: "Bangla Sketch | Architecture & Interior Design Studio",
    siteDescription: "Leading architectural and interior design consultancy in Dhaka, Bangladesh.",
    tagline: "ইন্টেরিয়র ডিজাইন যার হাতেখড়ি",
    language: "English",
  });
  const [contact, setContact] = useState<ContactSettings>({
    phone: "+880 1700 000000",
    whatsapp: "+880 1700 000000",
    email: "info@banglasketch.com",
    address: "Hashem Mansion, Level-1, 48 Kazi Nazrul Islam Ave, Dhaka 1215",
    workingHours: "Sat - Thu: 9:00 AM - 7:00 PM",
  });
  const [social, setSocial] = useState<SocialSettings>({
    facebook: "https://facebook.com/banglasketch",
    instagram: "https://instagram.com/banglasketch",
    youtube: "https://youtube.com/@banglasketch",
    linkedin: "",
  });

  // Security / Password State
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwShowCurrent, setPwShowCurrent] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwResetModalOpen, setPwResetModalOpen] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 1. Maintenance
      const mRes = await fetch("/api/maintenance");
      const mData = await mRes.json();
      if (mData.success && mData.data) {
        setMaintenance(mData.data);
      }

      // 2. Site settings from database
      const sRes = await adminFetch<Record<string, any>>("settings");
      if (sRes.success && sRes.data) {
        const settingsData = sRes.data;
        if (settingsData.general) setGeneral((prev) => ({ ...prev, ...settingsData.general }));
        if (settingsData.contact) setContact((prev) => ({ ...prev, ...settingsData.contact }));
        if (settingsData.social) setSocial((prev) => ({ ...prev, ...settingsData.social }));
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const TABS = [
    { id: "maintenance", label: "Maintenance Mode", icon: FiTool, highlight: true },
    { id: "general", label: "General", icon: FiGlobe },
    { id: "contact", label: "Contact Info", icon: FiPhone },
    { id: "social", label: "Social Media", icon: FiUsers },
    { id: "security", label: "Security & Password", icon: FiLock },
  ];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwError("All fields are required.");
      return;
    }
    if (pwNew.length < 8) {
      setPwError("New password must be at least 8 characters long.");
      return;
    }
    if (pwNew === pwCurrent) {
      setPwError("New password must be different from current password.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New passwords do not match. Please verify.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        window.location.assign("/admin/login");
        setPwCurrent("");
        setPwNew("");
        setPwConfirm("");
      } else {
        setPwError(data.error || "Failed to update password. Check your current password.");
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPassword) return;
    setReauthenticating(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: authPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAuthModalOpen(false);
        setAuthPassword("");
        // Retry save automatically after successful re-auth
        handleSave();
      } else {
        setAuthError(data.error || "Incorrect password. Please try again.");
      }
    } catch {
      setAuthError("Failed to connect to authentication server.");
    } finally {
      setReauthenticating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "maintenance") {
        const res = await fetch("/api/maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(maintenance),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setAuthModalOpen(true);
          return;
        }
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to save maintenance settings");
        }
        if (data.data) setMaintenance(data.data);
      } else if (activeTab === "general") {
        const res = await adminFetch("settings/general", {
          method: "PUT",
          body: JSON.stringify(general),
        });
        if (res.error?.toLowerCase().includes("unauthorized") || res.error?.includes("401")) {
          setAuthModalOpen(true);
          return;
        }
        if (!res.success) throw new Error(res.error || "Failed to save general settings");
      } else if (activeTab === "contact") {
        const res = await adminFetch("settings/contact", {
          method: "PUT",
          body: JSON.stringify(contact),
        });
        if (res.error?.toLowerCase().includes("unauthorized") || res.error?.includes("401")) {
          setAuthModalOpen(true);
          return;
        }
        if (!res.success) throw new Error(res.error || "Failed to save contact settings");
      } else if (activeTab === "social") {
        const res = await adminFetch("settings/social", {
          method: "PUT",
          body: JSON.stringify(social),
        });
        if (res.error?.toLowerCase().includes("unauthorized") || res.error?.includes("401")) {
          setAuthModalOpen(true);
          return;
        }
        if (!res.success) throw new Error(res.error || "Failed to save social settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err.message || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight flex flex-wrap items-center gap-2.5">
            <span>Studio Settings</span>
            {maintenance.enabled && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Maintenance Active
              </span>
            )}
          </h1>
          <p className="text-[#5A625A] text-sm mt-1">
            Persisted studio parameters for brand identity, contact channels, social profiles, and maintenance status.
          </p>
        </div>
        {activeTab !== "security" && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs active:scale-98 ${
              saved
                ? "bg-emerald-700 text-white"
                : "bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7]"
            }`}
          >
            <FiSave size={15} /> {saving ? "Saving..." : saved ? "Saved Successfully!" : "Save Changes"}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-2.5 flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar scroll-smooth shadow-xs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#586348] text-white shadow-xs"
                      : "text-[#5A625A] hover:bg-[#F5F2EB] hover:text-[#242824]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={15} /> {tab.label}
                  </span>
                  {tab.id === "maintenance" && maintenance.enabled && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {loading && (
            <div className="mb-4 px-4 py-2.5 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] text-xs text-[#586348] flex items-center gap-2">
              <FiRefreshCw className="animate-spin" size={14} />
              <span>Loading saved site configuration...</span>
            </div>
          )}

          {/* TAB: MAINTENANCE MODE */}
          {activeTab === "maintenance" && (
            <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-8 shadow-xs">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#242824] flex items-center gap-2">
                  <FiTool className="text-[#586348]" /> Maintenance Mode & Visitor Controls
                </h2>
                <p className="text-[#5A625A] text-xs mt-1">
                  Control how visitors experience your website during upgrades, portfolio updates, or technical maintenance.
                </p>
              </div>

              {/* Master Toggle Banner */}
              <div
                className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  maintenance.enabled
                    ? "bg-amber-50/80 border-amber-200"
                    : "bg-emerald-50/80 border-emerald-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      maintenance.enabled ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {maintenance.enabled ? <FiAlertTriangle /> : <FiCheckCircle />}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#242824]">
                      {maintenance.enabled ? "Maintenance Mode is ACTIVE" : "Website is LIVE & Accessible"}
                    </h3>
                    <p className="text-[#5A625A] text-xs mt-0.5">
                      {maintenance.enabled
                        ? `Visitors see the maintenance ${maintenance.mode}. You can still browse normally as admin.`
                        : "All visitors can freely browse the portfolio, architectural services, and submit inquiries."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintenance.enabled}
                      onChange={(e) => setMaintenance({ ...maintenance, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-[#DED5C7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#586348] shadow-inner"></div>
                  </label>
                  <span className="text-xs font-bold text-[#242824] min-w-[70px]">
                    {maintenance.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* Display Mode Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider">
                  Select Popup / Display Style
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "popup",
                      title: "Studio Modal Popup",
                      desc: "Elegant centered popup over website with architectural blur backdrop.",
                    },
                    {
                      id: "fullscreen",
                      title: "Fullscreen Takeover",
                      desc: "Complete branded splash screen covering entire site.",
                    },
                    {
                      id: "banner",
                      title: "Top Sticky Banner",
                      desc: "Non-intrusive alert banner pinned to top of all public pages.",
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setMaintenance({ ...maintenance, mode: mode.id as any })}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        maintenance.mode === mode.id
                          ? "border-[#586348] bg-[#EDF1EA] text-[#242824] shadow-xs"
                          : "border-[#DED5C7] bg-white hover:border-[#8C948C] text-[#5A625A] hover:text-[#242824]"
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1 text-[#242824]">{mode.title}</div>
                      <div className="text-xs text-[#737D73] leading-relaxed">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bilingual Message Content */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#586348] border-b border-[#DED5C7] pb-2">
                    English Content
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Popup Title</label>
                    <input
                      type="text"
                      value={maintenance.title}
                      onChange={(e) => setMaintenance({ ...maintenance, title: e.target.value })}
                      className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Message / Description</label>
                    <textarea
                      rows={3}
                      value={maintenance.message}
                      onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
                      className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#586348] border-b border-[#DED5C7] pb-2">
                    Bengali Content (বাংলা)
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Title in Bengali</label>
                    <input
                      type="text"
                      value={maintenance.titleBn}
                      onChange={(e) => setMaintenance({ ...maintenance, titleBn: e.target.value })}
                      className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Message in Bengali</label>
                    <textarea
                      rows={3}
                      value={maintenance.messageBn}
                      onChange={(e) => setMaintenance({ ...maintenance, messageBn: e.target.value })}
                      className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions & Preview */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#DED5C7]">
                <button
                  type="button"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#DED5C7] text-xs font-semibold text-[#242824] hover:bg-[#F5F2EB] transition shadow-xs w-full sm:w-auto"
                >
                  <FiEye size={15} className="text-[#586348]" /> {showLivePreview ? "Hide Preview" : "Preview Maintenance Popup"}
                </button>
              </div>

              {showLivePreview && (
                <div className="mt-6 p-6 rounded-2xl bg-[#F5F2EB] border border-[#586348] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#586348]">
                      Preview (Mode: {maintenance.mode.toUpperCase()})
                    </span>
                    <button onClick={() => setShowLivePreview(false)} className="text-xs text-[#5A625A] hover:text-[#242824] font-medium">
                      Close Preview ✕
                    </button>
                  </div>
                  <div className="max-w-md mx-auto bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-6 text-center shadow-lg space-y-3">
                    <div className="font-serif text-lg font-bold text-[#242824]">{maintenance.title || "Site Under Maintenance"}</div>
                    <div className="text-xs text-[#5A625A] leading-relaxed">{maintenance.message}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: GENERAL */}
          {activeTab === "general" && (
            <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#242824]">General Studio Parameters</h2>
                <p className="text-xs text-[#5A625A] mt-1">SEO meta tags, studio naming, and primary language settings.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Site Name</label>
                  <input
                    type="text"
                    value={general.siteName}
                    onChange={(e) => setGeneral({ ...general, siteName: e.target.value })}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Site Title (SEO)</label>
                  <input
                    type="text"
                    value={general.siteTitle}
                    onChange={(e) => setGeneral({ ...general, siteTitle: e.target.value })}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Site Description (SEO)</label>
                <textarea
                  rows={3}
                  value={general.siteDescription}
                  onChange={(e) => setGeneral({ ...general, siteDescription: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 resize-none"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Tagline</label>
                  <input
                    type="text"
                    value={general.tagline}
                    onChange={(e) => setGeneral({ ...general, tagline: e.target.value })}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Language</label>
                  <select
                    value={general.language}
                    onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                  >
                    <option>English</option>
                    <option>Bengali (বাংলা)</option>
                    <option>Bilingual</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACT */}
          {activeTab === "contact" && (
            <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#242824]">Contact Information</h2>
                <p className="text-xs text-[#5A625A] mt-1">Official studio hotline, email, office address, and hours.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">WhatsApp Hotline</label>
                  <input
                    type="text"
                    value={contact.whatsapp}
                    onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Email</label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Office Address</label>
                <textarea
                  rows={2}
                  value={contact.address}
                  onChange={(e) => setContact({ ...contact, address: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Working Hours</label>
                <input
                  type="text"
                  value={contact.workingHours}
                  onChange={(e) => setContact({ ...contact, workingHours: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                />
              </div>
            </div>
          )}

          {/* TAB: SOCIAL */}
          {activeTab === "social" && (
            <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#242824]">Social Media Channels</h2>
                <p className="text-xs text-[#5A625A] mt-1">Links displayed in public site footer and contact sections.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Facebook Page</label>
                <input
                  type="url"
                  value={social.facebook}
                  onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Instagram Profile</label>
                <input
                  type="url"
                  value={social.instagram}
                  onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">YouTube Channel</label>
                <input
                  type="url"
                  value={social.youtube}
                  onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">LinkedIn Profile</label>
                <input
                  type="url"
                  value={social.linkedin}
                  onChange={(e) => setSocial({ ...social, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/banglasketch"
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                />
              </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex items-center gap-3.5 pb-4 border-b border-[#DED5C7]">
                  <div className="w-12 h-12 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] text-[#586348] flex items-center justify-center shadow-xs">
                    <FiLock size={20} />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#242824]">Change Master Password</h2>
                    <p className="text-xs text-[#5A625A]">
                      Update your administrator credentials used to log in to this CMS.
                    </p>
                  </div>
                </div>

                {pwSuccess && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <FiCheckCircle className="shrink-0 mt-0.5" size={16} />
                    <span>{pwSuccess}</span>
                  </div>
                )}

                {pwError && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
                    <FiAlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <span>{pwError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={pwShowCurrent ? "text" : "password"}
                        value={pwCurrent}
                        onChange={(e) => {
                          setPwCurrent(e.target.value);
                          setPwError(null);
                        }}
                        placeholder="Enter your existing password"
                        required
                        className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 pr-11 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 placeholder:text-[#8C948C]"
                      />
                      <button
                        type="button"
                        onClick={() => setPwShowCurrent(!pwShowCurrent)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737D73] hover:text-[#242824]"
                      >
                        {pwShowCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={pwShowNew ? "text" : "password"}
                        value={pwNew}
                        onChange={(e) => {
                          setPwNew(e.target.value);
                          setPwError(null);
                        }}
                        placeholder="Must be at least 8 characters"
                        required
                        minLength={8}
                        className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 pr-11 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 placeholder:text-[#8C948C]"
                      />
                      <button
                        type="button"
                        onClick={() => setPwShowNew(!pwShowNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737D73] hover:text-[#242824]"
                      >
                        {pwShowNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={pwShowNew ? "text" : "password"}
                      value={pwConfirm}
                      onChange={(e) => {
                        setPwConfirm(e.target.value);
                        setPwError(null);
                      }}
                      placeholder="Re-enter your new password"
                      required
                      className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 placeholder:text-[#8C948C]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
                    >
                      {pwLoading ? (
                        <>
                          <FiRefreshCw className="animate-spin" size={15} />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <FiSave size={15} />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Emergency Recovery Card */}
              <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-3.5 pb-3 border-b border-[#DED5C7]">
                  <div className="w-12 h-12 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] text-[#586348] flex items-center justify-center shadow-xs">
                    <FiMail size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#242824]">Emergency Password Recovery</h3>
                    <p className="text-xs text-[#5A625A]">
                      Recovery email is configured for emergency 6-digit OTP verification.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#5A625A] leading-relaxed max-w-2xl">
                  In the event you are locked out or forget your password, the login screen provides an emergency OTP reset option. Codes will be dispatched securely to{" "}
                  <strong className="text-[#242824]">arifulhaquerohan@gmail.com</strong>.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPwResetModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#DED5C7] text-xs font-semibold text-[#586348] hover:bg-[#EDF1EA] transition shadow-xs"
                  >
                    <FiKey size={14} />
                    <span>Test OTP Recovery Flow</span>
                  </button>
                </div>
              </div>

              {/* Reset Password Modal */}
              <AdminResetPasswordModal
                isOpen={pwResetModalOpen}
                onClose={() => setPwResetModalOpen(false)}
                onSuccess={() => {
                  setPwSuccess("Password was successfully updated via OTP reset.");
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Session Expired / Re-authentication Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#242824]/60 backdrop-blur-sm p-4">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-[#242824]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
                <FiLock size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#242824]">Admin Session Expired</h3>
                <p className="text-xs text-[#5A625A]">Please re-enter your admin password to save changes.</p>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                {authError}
              </div>
            )}

            <form onSubmit={handleReauth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A625A] mb-1.5">Master Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  required
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    setAuthPassword("");
                    setAuthError("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A625A] hover:text-[#242824] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reauthenticating || !authPassword}
                  className="px-5 py-2.5 bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  {reauthenticating ? "Verifying..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
