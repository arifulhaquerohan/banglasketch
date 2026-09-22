"use client";

import Image from "next/image";
import { adminReturnPath } from "@/lib/admin-return-path";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FiLock } from "react-icons/fi";
import AdminResetPasswordModal from "@/components/admin/AdminResetPasswordModal";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [totp, setTotp] = useState("");
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = adminReturnPath(searchParams.get("from"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, email: email || undefined, totp: totp || undefined }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(from);
        router.refresh();
      } else {
        setRequiresTotp(Boolean(data.requiresTotp));
        setError(data.error || "Incorrect credentials. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-admin-surface border border-admin-border rounded-3xl p-8 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6 p-3.5 bg-admin-canvas rounded-2xl border border-admin-border">
          <div className="w-9 h-9 rounded-xl bg-admin-primary text-white flex items-center justify-center shadow-sm">
            <FiLock size={15} />
          </div>
          <div>
            <span className="text-xs text-admin-ink font-semibold block leading-tight">Admin Authentication</span>
            <span className="text-[10px] text-admin-primary">Bangla Sketch Studio CMS</span>
          </div>
        </div>

        <label htmlFor="admin-email" className="block text-xs text-admin-muted font-semibold mb-2">Administrator Email</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@banglasketch.com"
          autoComplete="username"
          className="w-full bg-admin-surface border border-admin-border rounded-2xl px-5 py-3.5 mb-3 text-sm text-admin-ink placeholder:text-admin-subtle focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20 transition-all"
        />

        <label htmlFor="admin-password" className="block text-xs text-admin-muted font-semibold mb-2">Admin Password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="Enter admin password"
          className={`w-full bg-admin-surface border rounded-2xl px-5 py-3.5 mb-3 text-sm text-admin-ink placeholder:text-admin-subtle focus:outline-none focus:ring-2 transition-all duration-200 tracking-wide ${
            error
              ? "border-red-500/60 bg-red-50 focus:ring-red-400/20"
              : "border-admin-border focus:border-admin-primary focus:ring-admin-primary/20"
          }`}
          autoFocus
          autoComplete="current-password"
        />

        {requiresTotp && (
          <div className="mb-3">
            <label className="block text-xs text-admin-muted font-semibold mb-2">Two-Factor Code</label>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={totp}
              onChange={(event) => setTotp(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit authentication code"
              autoComplete="one-time-code"
              className="w-full bg-admin-surface border border-admin-border rounded-2xl px-5 py-3.5 text-sm text-admin-ink focus:outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
            />
          </div>
        )}

        {error && (
          <p className="text-red-700 text-xs mb-3 font-medium bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-admin-ink hover:bg-admin-elevated text-admin-surface font-semibold py-3.5 rounded-2xl active:scale-[0.985] transition-all shadow-md text-sm tracking-wide disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Access Workspace"}
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
      </form>

      <AdminResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onSuccess={() => {
          setPassword("");
          setError(null);
        }}
      />
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-admin-canvas flex items-start justify-center px-4 py-8 overflow-y-auto">
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
            <div className="relative w-28 h-28 mx-auto rounded-full shadow-md bg-admin-tint p-2 border border-admin-border">
              <Image
                src="/brand-icon.png"
                alt="Bangla Sketch Logo"
                width={112}
                height={112}
                className="w-full h-full object-contain p-2"
                priority
                unoptimized
              />
            </div>
            <p className="text-[11px] tracking-[0.25em] text-admin-primary uppercase font-semibold mt-3">
              Architectural Studio
            </p>
          </div>
          <h1 className="text-3xl font-serif font-bold text-admin-ink tracking-tight mb-1">Bangla Sketch</h1>
          <p className="text-admin-muted text-sm">Admin Management Console</p>
        </div>

        <Suspense fallback={<div className="text-center text-admin-primary py-8 text-xs uppercase tracking-wider font-semibold">Loading console...</div>}>
          <LoginForm />
        </Suspense>

        <Link
          href="/"
          className="block text-center text-admin-primary hover:text-admin-ink text-xs mt-6 transition-all hover:-translate-y-0.5 tracking-wide font-medium"
        >
          ← Return to Public Website
        </Link>
      </div>
    </div>
  );
}
