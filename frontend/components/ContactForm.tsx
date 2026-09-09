"use client";

import { useRef, useState } from "react";
import { FiSend, FiCheck, FiAlertCircle } from "react-icons/fi";
import { SERVICES } from "../lib/constants";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", serviceType: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const startedAt = useRef(Date.now());
  const [website, setWebsite] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website, started_at: startedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setStatus("success");
      setForm({ name: "", email: "", phone: "", serviceType: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const input = (field: string) => ({
    value: form[field as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [field]: e.target.value }),
    className: `w-full bg-[#FCFAF7] border rounded-2xl px-4 py-3 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none transition-all duration-200 ${
      errors[field]
        ? "border-red-500/70 focus:border-red-500 ring-2 ring-red-400/20"
        : "border-[#DED5C7] focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20"
    }`,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        name="website"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Full Name *
          </label>
          <input {...input("name")} placeholder="e.g. Tanvir Ahmed" />
          {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Email Address *
          </label>
          <input {...input("email")} type="email" placeholder="tanvir@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Phone (optional)
          </label>
          <input {...input("phone")} type="tel" placeholder="+880 1712-000000" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Space / Service
          </label>
          <select {...input("serviceType")}>
            <option value="">Select architectural service</option>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="other">Full Apartment Renovation</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
          Project Details & Notes *
        </label>
        <textarea
          {...input("message")}
          rows={5}
          placeholder="Share your space size, location (e.g. Gulshan), aesthetic preferences, and budget goals..."
          className={`w-full bg-[#FCFAF7] border rounded-2xl px-4 py-3 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none transition-all duration-200 resize-none ${
            errors.message
              ? "border-red-500/70 focus:border-red-500 ring-2 ring-red-400/20"
              : "border-[#DED5C7] focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20"
          }`}
        />
        {errors.message && <p className="text-red-500 text-xs mt-1.5">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-primary w-full text-sm py-4 shadow-sm"
      >
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#FCFAF7]/30 border-t-[#FCFAF7] rounded-full animate-spin" />
            <span>Sending Inquiry...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <FiSend size={16} />
            <span>Submit Consultation Request</span>
          </span>
        )}
      </button>

      {status === "success" && (
        <div className="flex items-center gap-3 bg-[#EDF1EA] border border-[#D5DEC4] text-[#444D37] p-4 rounded-2xl">
          <FiCheck size={20} className="shrink-0 text-[#586348]" />
          <p className="text-xs sm:text-sm font-medium">
            Thank you! Our studio team will review your inquiry and connect with you within 24 hours.
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          <FiAlertCircle size={20} className="shrink-0 text-red-500" />
          <p className="text-xs sm:text-sm">
            Something went wrong submitting your request. Please call or message us directly on WhatsApp.
          </p>
        </div>
      )}
    </form>
  );
}
