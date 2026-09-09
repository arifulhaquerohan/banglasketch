"use client";

import { useState } from "react";
import { FiSend, FiCheck, FiAlertCircle } from "react-icons/fi";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to subscribe");
      setStatus("success");
      setEmail("");
    } catch { setStatus("error"); }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-[#c5a059] text-sm">
        <FiCheck /> Subscribed! Welcome aboard.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="input text-sm py-2 flex-1" required aria-label="Email address for newsletter" />
        <button type="submit" disabled={status === "loading"} className="btn btn-primary px-4 py-2 text-sm" aria-label="Subscribe to newsletter">
          {status === "loading" ? <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> : <FiSend size={14} />}
        </button>
      </div>
      {status === "error" && <p role="alert" className="flex items-center gap-1.5 text-xs text-red-300"><FiAlertCircle /> We could not subscribe you right now. Please try again.</p>}
    </form>
  );
}
