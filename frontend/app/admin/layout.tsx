"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiChevronRight,
  FiFileText,
  FiHome,
  FiImage,
  FiLock,
  FiLogOut,
  FiMail,
  FiMenu,
  FiSettings,
  FiShield,
  FiStar,
  FiTrash2,
  FiUsers,
  FiVideo,
  FiX,
} from "react-icons/fi";
import AdminResetPasswordModal from "@/components/admin/AdminResetPasswordModal";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FiHome, exact: true },
  { href: "/admin/enquiries", label: "Client Pipeline", icon: FiUsers },
  { href: "/admin/client-projects", label: "Client Projects", icon: FiBriefcase },
  { href: "/admin/invoices", label: "Invoices", icon: FiFileText },
  { href: "/admin/site-visits", label: "Site Visits", icon: FiCalendar },
  { href: "/admin/projects", label: "Portfolio Showcase", icon: FiImage },
  { href: "/admin/blog", label: "Blog Posts", icon: FiFileText },
  { href: "/admin/videos", label: "Videos", icon: FiVideo },
  { href: "/admin/testimonials", label: "Testimonials", icon: FiStar },
  { href: "/admin/contacts", label: "General Inquiries", icon: FiMail },
  { href: "/admin/trash", label: "Recycle Bin", icon: FiTrash2 },
  { href: "/admin/settings", label: "Settings", icon: FiSettings },
  { href: "/admin/security", label: "Security", icon: FiShield },
];

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [email, setEmail] = useState("");
  const [totp, setTotp] = useState("");
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [error, setError] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const attempt = async () => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, email: email || undefined, totp: totp || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUnlock();
      } else {
        setRequiresTotp(Boolean(data.requiresTotp));
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="admin-theme fixed inset-0 z-[100] bg-admin-canvas flex items-start justify-center px-4 py-8 overflow-y-auto">
      {/* Decorative subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #242824 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-admin-primary/10 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-admin-border/30 blur-[90px]" />

      <div className="relative w-full max-w-md my-auto">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="relative w-28 h-28 mx-auto rounded-3xl shadow-sm bg-white p-3 border border-admin-border flex items-center justify-center">
              <Image src="/brand-icon.png" alt="bangla sketch" width={96} height={96} className="w-full h-full object-contain p-2" priority unoptimized />
            </div>
            <p className="text-[11px] tracking-[0.25em] text-admin-primary uppercase font-semibold mt-3">
              Architectural Studio
            </p>
          </div>
          <h2 className="text-3xl font-serif font-bold text-admin-ink tracking-tight mb-1">
            bangla <span className="text-[#D05A3F] font-sans font-semibold text-2xl">sketch</span>
          </h2>
          <p className="text-admin-muted text-sm">Admin Management Console</p>
        </div>

        {/* Login card */}
        <div className="bg-admin-surface border border-admin-border rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 p-3.5 bg-admin-canvas rounded-2xl border border-admin-border">
            <div className="w-9 h-9 rounded-xl bg-admin-primary text-white flex items-center justify-center shadow-sm">
              <FiLock size={15} />
            </div>
            <div>
              <span className="text-xs text-admin-ink font-semibold block leading-tight">Admin Authentication</span>
              <span className="text-[10px] text-admin-primary">Banglasketch Studio CMS</span>
            </div>
          </div>

          <input
            aria-label="Administrator email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Administrator email"
            autoComplete="username"
            className="w-full bg-admin-surface border border-admin-border rounded-2xl px-5 py-3.5 mb-3 text-sm text-admin-ink placeholder:text-admin-subtle focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20 transition-all"
          />
          <input
            aria-label="Admin password"
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && attempt()}
            placeholder="Enter admin password"
            className={`w-full bg-admin-surface border rounded-2xl px-5 py-3.5 mb-4 text-sm text-admin-ink placeholder:text-admin-subtle focus:outline-none focus:ring-2 transition-all ${
              error
                ? "border-red-500/60 bg-red-50 focus:ring-red-400/20"
                : "border-admin-border focus:border-admin-primary focus:ring-admin-primary/20"
            }`}
          />
          {requiresTotp && (
            <input
              aria-label="Authentication code"
              inputMode="numeric"
              maxLength={6}
              value={totp}
              onChange={(event) => setTotp(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit authentication code"
              autoComplete="one-time-code"
              className="w-full bg-admin-surface border border-admin-border rounded-2xl px-5 py-3.5 mb-4 text-sm text-admin-ink focus:outline-none focus:border-admin-primary"
            />
          )}

          <button
            onClick={attempt}
            className="w-full bg-admin-ink hover:bg-admin-elevated text-admin-surface font-semibold py-3.5 rounded-2xl active:scale-[0.985] transition-all shadow-md text-sm tracking-wide"
          >
            {error ? "Incorrect Credentials — Try Again" : "Access Workspace"}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="text-xs text-admin-primary hover:text-admin-ink hover:underline transition font-medium"
            >
              Forgot password? Reset via OTP
            </button>
          </div>

          <p className="text-center text-[11px] text-admin-subtle mt-4">
            Authorized architectural personnel only
          </p>

          <AdminResetPasswordModal
            isOpen={resetModalOpen}
            onClose={() => setResetModalOpen(false)}
            onSuccess={() => {
              setPw("");
              setError(false);
            }}
          />
        </div>

        <Link
          href="/"
          className="block text-center text-admin-primary hover:text-admin-ink text-xs mt-6 transition-all hover:-translate-y-0.5"
        >
          ← Return to Public Website
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locked, setLocked] = useState(true);
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    let active = true;
    async function verify() {
      setChecking(true);
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        if (!active) return;
        setLocked(!res.ok);
      } catch {
        // Leave locked on network error
      } finally {
        if (active) setChecking(false);
      }
    }
    verify();
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    setLocked(true);
    setSidebarOpen(false);
    router.replace("/admin/login");
  };

  const currentSection =
    NAV.find((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))?.label ?? "Dashboard";
  const isEditing = /\/(new|\d+)$/.test(pathname);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (isLoginPage) {
    return <div className="admin-theme">{children}</div>;
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-[100] bg-admin-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-9 h-9 border-2 border-admin-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-admin-primary font-semibold">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (locked) return <PasswordGate onUnlock={() => setLocked(false)} />;

  return (
    <div className="admin-theme min-h-screen bg-admin-canvas text-admin-ink">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-admin-ink border-b border-admin-elevated px-4 py-3 flex items-center justify-between shadow-md pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-admin-elevated p-1 flex items-center justify-center">
            <Image src="/brand-icon.png" alt="Logo" width={32} height={32} className="w-full h-full object-contain" unoptimized />
          </div>
          <div>
            <div className="text-sm font-semibold text-admin-surface tracking-wide">Bangla Sketch</div>
            <div className="text-[10px] text-[#A8B2A8] font-medium">Studio CMS</div>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-admin-surface p-2 rounded-xl bg-white/10 hover:bg-admin-primary transition-colors"
          aria-expanded={sidebarOpen}
          aria-controls="admin-navigation"
          aria-label="Toggle Navigation Drawer"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Charcoal Sidebar */}
      <aside
        id="admin-navigation"
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[90vw] sm:w-80 lg:w-64 bg-admin-ink border-r border-admin-elevated transition-transform duration-300 ease-out shadow-2xl flex flex-col pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-5 border-b border-admin-elevated flex items-center justify-between">
          <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-admin-elevated p-1 shadow-sm border border-white/10 flex items-center justify-center">
              <Image src="/brand-icon.png" alt="Banglasketch" width={40} height={40} className="w-full h-full object-contain" unoptimized />
            </div>
            <div>
              <div className="font-serif font-bold text-admin-surface text-base leading-tight">Bangla Sketch</div>
              <div className="text-[10px] text-[#A8B2A8] font-medium uppercase tracking-wider">Studio CMS</div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto overscroll-contain">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group ${
                  active
                    ? "bg-admin-primary text-white shadow-sm"
                    : "text-[#A8B2A8] hover:bg-admin-elevated hover:text-admin-surface"
                }`}
              >
                <Icon
                  size={16}
                  className={active ? "text-white" : "text-admin-subtle group-hover:text-admin-surface"}
                />
                <span>{item.label}</span>
                {active && <FiChevronRight size={13} className="ml-auto opacity-80" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-admin-elevated space-y-1 bg-[#1A1D1A]">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xs text-[#A8B2A8] hover:text-admin-surface transition-colors px-4 py-2.5 rounded-xl hover:bg-admin-elevated"
          >
            <FiLogOut size={14} className="text-[#829070]" /> View Public Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 text-xs text-[#A8B2A8] hover:text-red-400 transition-colors px-4 py-2.5 rounded-xl hover:bg-red-500/10 w-full text-left"
          >
            <FiLock size={14} /> Lock Panel
          </button>
        </div>
      </aside>

      {/* Main Content Area - Light Ivory Workspace */}
      <div className="lg:ml-64 pt-[calc(3.75rem+env(safe-area-inset-top))] lg:pt-0 min-h-screen">
        {/* Top Header */}
        <header className="hidden lg:flex sticky top-0 z-20 bg-admin-surface/95 backdrop-blur border-b border-admin-border px-8 py-4 items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <Link href="/admin" className="text-admin-muted hover:text-admin-ink transition-colors font-medium">
              Studio CMS
            </Link>
            <FiChevronRight size={13} className="text-admin-subtle" />
            <span className={`font-semibold ${isEditing ? "text-admin-muted" : "text-admin-ink"}`}>
              {currentSection}
            </span>
            {isEditing && (
              <>
                <FiChevronRight size={13} className="text-admin-subtle" />
                <span className="font-semibold text-admin-ink">{pathname.endsWith("/new") ? "New" : "Edit"}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <span className="text-xs text-admin-subtle tabular-nums font-medium">{today}</span>
            <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-semibold text-admin-hover bg-[#EDF1EA] border border-[#D5DEC4] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-admin-primary" /> Session active
            </span>
            <div className="flex items-center gap-3 pl-3 border-l border-admin-border">
              <div className="text-right">
                <div className="text-xs font-semibold text-admin-ink">Administrator</div>
                <div className="text-[10px] text-admin-primary">Bangla Sketch</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-admin-ink flex items-center justify-center text-admin-surface font-serif font-bold text-xs shadow-xs">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="admin-workspace min-w-0 p-4 sm:p-6 lg:p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-admin-canvas">
          {children}
        </div>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" />
      )}
    </div>
  );
}
