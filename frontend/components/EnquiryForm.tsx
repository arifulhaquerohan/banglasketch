"use client";

import { useRef, useState } from "react";
import { FiSend, FiCheck, FiAlertCircle, FiUploadCloud } from "react-icons/fi";

const DHAKA_LOCATIONS = [
  "Gulshan",
  "Banani",
  "Baridhara",
  "Bashundhara R/A",
  "Dhanmondi",
  "Uttara",
  "Mohakhali DOHS",
  "Mirpur DOHS",
  "Baridhara DOHS",
  "Mirpur",
  "Puran Dhaka",
  "Outside Dhaka",
];

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment" },
  { id: "house", label: "Independent House" },
  { id: "office", label: "Office / Studio" },
  { id: "commercial_space", label: "Commercial Space" },
  { id: "other", label: "Other Space" },
];

const SERVICE_SCOPES = [
  { id: "interior_design", label: "Interior Design" },
  { id: "renovation", label: "Renovation" },
  { id: "both", label: "Both (Design & Complete Renovation)" },
];

const BUDGET_RANGES = [
  "Under 10 Lakhs BDT",
  "10 - 25 Lakhs BDT",
  "25 - 50 Lakhs BDT",
  "50 Lakhs - 1 Crore BDT",
  "1 Crore+ BDT",
  "Flexible / Need Guidance",
];

const TIMELINES = [
  "Immediately (Within 2 weeks)",
  "Within 1 month",
  "1 - 3 months",
  "Planning ahead (3+ months)",
];

export function EnquiryForm({ onSubmitted }: { onSubmitted?: (enquiryId: number) => void }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    project_location: "",
    property_type: "apartment",
    service_scope: "both",
    approx_budget: "10 - 25 Lakhs BDT",
    preferred_start_date: "Within 1 month",
    notes: "",
    attachmentUrl: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const startedAt = useRef(Date.now());
  const [website, setWebsite] = useState("");

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Your full name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (form.phone.trim().length < 6) errs.phone = "Enter a valid phone number";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Enter a valid email address";
    }
    if (!form.project_location.trim()) errs.project_location = "Location is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStatus("loading");
    setErrorMessage("");

    try {
      const attachments = form.attachmentUrl.trim() ? [form.attachmentUrl.trim()] : [];
      const res = await fetch("/api/v1/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          project_location: form.project_location,
          property_type: form.property_type,
          service_scope: form.service_scope,
          approx_budget: form.approx_budget,
          preferred_start_date: form.preferred_start_date,
          notes: form.notes,
          attachments,
          website,
          started_at: startedAt.current,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit enquiry");
      }

      setStatus("success");
      if (onSubmitted && data.data?.id) {
        onSubmitted(data.data.id);
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-[#242824]">
      {/* Honeypot */}
      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />

      {/* Row 1: Name and Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Asif Rahman"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`w-full bg-[#FCFAF7] border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 ${
              errors.name ? "border-red-500 ring-2 ring-red-400/20" : "border-[#DED5C7] focus:border-[#586348]"
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            placeholder="+880 1711-XXXXXX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={`w-full bg-[#FCFAF7] border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 ${
              errors.phone ? "border-red-500 ring-2 ring-red-400/20" : "border-[#DED5C7] focus:border-[#586348]"
            }`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Row 2: Location and Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Project Location *
          </label>
          <input
            list="dhaka-locations"
            required
            placeholder="Select or type (e.g. Gulshan-2)"
            value={form.project_location}
            onChange={(e) => setForm({ ...form, project_location: e.target.value })}
            className={`w-full bg-[#FCFAF7] border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 ${
              errors.project_location ? "border-red-500 ring-2 ring-red-400/20" : "border-[#DED5C7] focus:border-[#586348]"
            }`}
          />
          <datalist id="dhaka-locations">
            {DHAKA_LOCATIONS.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
          {errors.project_location && <p className="text-red-500 text-xs mt-1">{errors.project_location}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Email Address (Optional)
          </label>
          <input
            type="email"
            placeholder="name@domain.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#586348] transition-all duration-200"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Row 3: Space Type & Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Space / Property Type
          </label>
          <select
            value={form.property_type}
            onChange={(e) => setForm({ ...form, property_type: e.target.value })}
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#586348]"
          >
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Service Scope
          </label>
          <select
            value={form.service_scope}
            onChange={(e) => setForm({ ...form, service_scope: e.target.value })}
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#586348]"
          >
            {SERVICE_SCOPES.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 4: Budget & Start Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Approximate Budget
          </label>
          <select
            value={form.approx_budget}
            onChange={(e) => setForm({ ...form, approx_budget: e.target.value })}
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#586348]"
          >
            {BUDGET_RANGES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
            Preferred Start Date
          </label>
          <select
            value={form.preferred_start_date}
            onChange={(e) => setForm({ ...form, preferred_start_date: e.target.value })}
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#586348]"
          >
            {TIMELINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes / Requirements */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348]">
          Project Details, Space Size & Special Notes
        </label>
        <textarea
          rows={4}
          placeholder="e.g. 2,400 sq ft duplex apartment in Gulshan. Need modular kitchen, bespoke master bedroom woodwork, and acoustic living room styling..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#586348] resize-none"
        />
      </div>

      {/* Optional floor plan link */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#586348] flex items-center gap-1.5">
          <FiUploadCloud size={15} /> Floor Plan or Photo Link (Optional)
        </label>
        <input
          type="url"
          placeholder="Google Drive, Dropbox, or image link"
          value={form.attachmentUrl}
          onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
          className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#586348]"
        />
        <p className="text-[11px] text-[#788278] mt-1">
          You can share a cloud link now or WhatsApp/email your floor plan directly after submitting.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="btn btn-primary w-full text-sm py-4 shadow-sm font-medium"
      >
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#FCFAF7]/30 border-t-[#FCFAF7] rounded-full animate-spin" />
            <span>Processing Consultation Request...</span>
          </span>
        ) : status === "success" ? (
          <span className="flex items-center justify-center gap-2 text-white">
            <FiCheck size={18} />
            <span>Consultation Request Submitted</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <FiSend size={16} />
            <span>Submit Architectural Enquiry</span>
          </span>
        )}
      </button>

      {status === "success" && (
        <div className="flex items-start gap-3 bg-[#EDF1EA] border border-[#D5DEC4] text-[#444D37] p-5 rounded-2xl">
          <FiCheck size={22} className="shrink-0 text-[#586348] mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Thank You for Your Consultation Request!</h4>
            <p className="text-xs sm:text-sm mt-1 leading-relaxed text-[#5A625A]">
              We have assigned your enquiry to our studio design team. An architect will review your project requirements and connect with you within 24 hours.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          <FiAlertCircle size={20} className="shrink-0 text-red-500" />
          <p className="text-xs sm:text-sm">{errorMessage}</p>
        </div>
      )}
    </form>
  );
}
