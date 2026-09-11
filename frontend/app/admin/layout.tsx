"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiBriefcase,
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
    <div className="fixed inset-0 z-[100] bg-[#F5F2EB] flex items-center justify-center px-6 overflow-hidden">
      {/* Decorative subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #242824 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#586348]/10 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#DED5C7]/30 blur-[90px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="relative w-28 h-28 mx-auto rounded-full shadow-md bg-[#EDE7DE] p-2 border border-[#DED5C7]">
              <Image src="/logo.svg" alt="Bangla Sketch" width={112} height={112} className="w-full h-full" priority unoptimized />
            </div>
            <p className="text-[11px] tracking-[0.25em] text-[#586348] uppercase font-semibold mt-3">
              Architectural Studio
            </p>
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#242824] tracking-tight mb-1">Bangla Sketch</h2>
          <p className="text-[#5A625A] text-sm">Admin Management Console</p>
        </div>

        {/* Login card */}
        <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 p-3.5 bg-[#F5F2EB] rounded-2xl border border-[#DED5C7]">
            <div className="w-9 h-9 rounded-xl bg-[#586348] text-white flex items-center justify-center shadow-sm">
              <FiLock size={15} />
            </div>
            <div>
              <span className="text-xs text-[#242824] font-semibold block leading-tight">Admin Authentication</span>
              <span className="text-[10px] text-[#586348]">Banglasketch Studio CMS</span>
            </div>
          </div>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Administrator email"
            autoComplete="username"
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-5 py-3.5 mb-3 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20 transition-all"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && attempt()}
            placeholder="Enter admin password"
            className={`w-full bg-[#FCFAF7] border rounded-2xl px-5 py-3.5 mb-4 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none focus:ring-2 transition-all ${
              error
                ? "border-red-500/60 bg-red-50 focus:ring-red-400/20"
                : "border-[#DED5C7] focus:border-[#586348] focus:ring-[#586348]/20"
            }`}
          />
          {requiresTotp && (
            <input
              inputMode="numeric"
              maxLength={6}
              value={totp}
              onChange={(event) => setTotp(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit authentication code"
              autoComplete="one-time-code"
              className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-5 py-3.5 mb-4 text-sm text-[#242824] focus:outline-none focus:border-[#586348]"
            />
          )}

          <button
            onClick={attempt}
            className="w-full bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] font-semibold py-3.5 rounded-2xl active:scale-[0.985] transition-all shadow-md text-sm tracking-wide"
          >
            {error ? "Incorrect Credentials — Try Again" : "Access Workspace"}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="text-xs text-[#586348] hover:text-[#242824] hover:underline transition font-medium"
            >
              Forgot password? Reset via OTP
            </button>
          </div>

          <p className="text-center text-[11px] text-[#737D73] mt-4">
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
          className="block text-center text-[#586348] hover:text-[#242824] text-xs mt-6 transition-all hover:-translate-y-0.5"
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
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        if (!active) return;
        if (res.ok) setLocked(false);
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
  }, []);

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
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#F5F2EB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-9 h-9 border-2 border-[#586348] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-[#586348] font-semibold">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (locked) return <PasswordGate onUnlock={() => setLocked(false)} />;

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#242824]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#242824] border-b border-[#383E38] px-4 py-3 flex items-center justify-between shadow-md pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-[#383E38] p-1">
            <Image src="/logo.svg" alt="Logo" width={32} height={32} className="w-full h-full" unoptimized />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#FCFAF7] tracking-wide">Bangla Sketch</div>
            <div className="text-[10px] text-[#A8B2A8] font-medium">Studio CMS</div>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[#FCFAF7] p-2 rounded-xl bg-white/10 hover:bg-[#586348] transition-colors"
          aria-label="Toggle Navigation Drawer"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Charcoal Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 sm:w-80 lg:w-64 bg-[#242824] border-r border-[#383E38] transition-transform duration-300 ease-out shadow-2xl flex flex-col pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-5 border-b border-[#383E38] flex items-center justify-between">
          <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-[#383E38] p-1.5 shadow-sm border border-white/10">
              <Image src="/logo.svg" alt="Banglasketch" width={40} height={40} className="w-full h-full" unoptimized />
            </div>
            <div>
              <div className="font-serif font-bold text-[#FCFAF7] text-base leading-tight">Bangla Sketch</div>
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
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group ${
                  active
                    ? "bg-[#586348] text-white shadow-sm"
                    : "text-[#A8B2A8] hover:bg-[#383E38] hover:text-[#FCFAF7]"
                }`}
              >
                <Icon
                  size={16}
                  className={active ? "text-white" : "text-[#737D73] group-hover:text-[#FCFAF7]"}
                />
                <span>{item.label}</span>
                {active && <FiChevronRight size={13} className="ml-auto opacity-80" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#383E38] space-y-1 bg-[#1A1D1A]">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xs text-[#A8B2A8] hover:text-[#FCFAF7] transition-colors px-4 py-2.5 rounded-xl hover:bg-[#383E38]"
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
        <header className="hidden lg:flex sticky top-0 z-20 bg-[#FCFAF7]/95 backdrop-blur border-b border-[#DED5C7] px-8 py-4 items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <Link href="/admin" className="text-[#5A625A] hover:text-[#242824] transition-colors font-medium">
              Studio CMS
            </Link>
            <FiChevronRight size={13} className="text-[#8C948C]" />
            <span className={`font-semibold ${isEditing ? "text-[#5A625A]" : "text-[#242824]"}`}>
              {currentSection}
            </span>
            {isEditing && (
              <>
                <FiChevronRight size={13} className="text-[#8C948C]" />
                <span className="font-semibold text-[#242824]">{pathname.endsWith("/new") ? "New" : "Edit"}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <span className="text-xs text-[#737D73] tabular-nums font-medium">{today}</span>
            <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#444D37] bg-[#EDF1EA] border border-[#D5DEC4] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#586348]" /> Session active
            </span>
            <div className="flex items-center gap-3 pl-3 border-l border-[#DED5C7]">
              <div className="text-right">
                <div className="text-xs font-semibold text-[#242824]">Administrator</div>
                <div className="text-[10px] text-[#586348]">Bangla Sketch</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#242824] flex items-center justify-center text-[#FCFAF7] font-serif font-bold text-xs shadow-xs">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="p-4 sm:p-6 lg:p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-[#F5F2EB]">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" />
      )}
    </div>
  );
}
