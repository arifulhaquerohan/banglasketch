"use client";

import React, { useState } from "react";
import { FiCheckCircle, FiSend, FiUploadCloud, FiAlertCircle } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

export function SanctuaryEnquiryForm() {
  const { items, totalCount } = useSpaceCollection();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "Gulshan II",
    scope: "entire-home",
    timeline: "Within 3 Months",
    message: "",
    attachmentUrl: "",
  });
  const [includeCollection, setIncludeCollection] = useState(true);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const collectionNote = includeCollection && items.length > 0
        ? `\n[Attached Collection: ${items.map(i => i.title).join(", ")}]`
        : "";
      const planNote = formData.attachmentUrl?.trim()
        ? `\n[Blueprint / Document Link: ${formData.attachmentUrl.trim()}]`
        : "";

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `${formData.message}\n\n[Location: ${formData.location} | Scope: ${formData.scope} | Timeline: ${formData.timeline}]${collectionNote}${planNote}`,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to submit enquiry. Please try again or reach out on WhatsApp.");
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unable to submit enquiry. Please try again or reach out on WhatsApp.");
    }
  };

  return (
    <section id="enquiry" className="section bg-[#EDE7DE] border-b border-[#DDD5C8] relative">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Welcoming Final Invitation Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61]">
              <span className="w-2 h-2 rounded-full bg-[#A45138]" />
              <span>Initiate the Dialogue</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
              Tell us about the space you’re imagining.
            </h2>

            <p className="text-base text-[#5A6057] leading-relaxed">
              Every home transformation begins with a conversation. Whether you have architectural blueprints in hand, are awaiting apartment handover, or are simply exploring what is possible, our studio architects are here to guide you.
            </p>

            {/* Space Collection Attached Pill */}
            {totalCount > 0 && (
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#DDD5C8] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#A45138]" />
                    <span className="architectural-tag text-[#727A61]">
                      Your Space Collection Attached
                    </span>
                  </div>
                  <label className="text-xs text-[#5A6057] flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCollection}
                      onChange={(e) => setIncludeCollection(e.target.checked)}
                      className="rounded border-[#DDD5C8] text-[#A45138] focus:ring-[#A45138]"
                    />
                    Include {totalCount} items
                  </label>
                </div>
                <p className="text-xs text-[#5A6057]">
                  Your curated projects and material swatches will be attached to this enquiry so our architects understand your aesthetic preferences immediately.
                </p>
              </div>
            )}

            {/* What Happens Next Roadmap */}
            <div className="pt-6 border-t border-[#DDD5C8] space-y-4">
              <h3 className="architectural-tag text-[#242622]">What Happens Next</h3>
              <div className="space-y-3 text-xs text-[#5A6057]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] flex items-center justify-center font-mono font-bold text-[#A45138] shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-[#242622] block font-serif text-sm">Studio Architectural Review</strong>
                    Our lead architect reviews your spatial parameters within 24 business hours.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] flex items-center justify-center font-mono font-bold text-[#A45138] shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-[#242622] block font-serif text-sm">30-Minute Spatial Discovery</strong>
                    A relaxed video call or coffee in our Dhaka studio to discuss timeline, finishes, and budget.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] flex items-center justify-center font-mono font-bold text-[#A45138] shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-[#242622] block font-serif text-sm">Complimentary Site Audit</strong>
                    We visit your residence in Dhaka to take initial measurements and provide feasibility guidance.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Short Architectural Enquiry Form */}
          <div className="lg:col-span-7 bg-[#FAF7F2] p-6 sm:p-10 rounded-2xl border border-[#DDD5C8] shadow-xl">
            {status === "success" ? (
              <div className="text-center py-12 space-y-4 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#EEF1EA] border border-[#D0D6C7] flex items-center justify-center text-[#727A61]">
                  <FiCheckCircle size={32} />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-[#242622]">
                  Enquiry Received with Gratitude
                </h3>
                <p className="text-sm text-[#5A6057] max-w-md mx-auto leading-relaxed">
                  Thank you for inviting us into your vision. Our studio team will review your project parameters and reach out within 24 hours to schedule your consultation.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setStatus("idle")}
                    className="btn btn-secondary text-xs px-6 py-2.5"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Farhan Chowdhury"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+880 1712-458794"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Property Location (Dhaka)
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="input text-sm"
                    >
                      <option value="Gulshan II">Gulshan I / II</option>
                      <option value="Banani">Banani</option>
                      <option value="Baridhara">Baridhara / Baridhara DOHS</option>
                      <option value="Dhanmondi">Dhanmondi</option>
                      <option value="Uttara">Uttara</option>
                      <option value="Bashundhara">Bashundhara R/A</option>
                      <option value="Other">Other Location in Bangladesh</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Project Scope
                    </label>
                    <select
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                      className="input text-sm"
                    >
                      <option value="entire-home">An Entire Home (Turnkey)</option>
                      <option value="one-room">One Room (Kitchen, Master Suite, Living)</option>
                      <option value="renovation">A Renovation (Remodel)</option>
                      <option value="commercial">Studio / Commercial Space</option>
                    </select>
                  </div>

                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Anticipated Timeline
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="input text-sm"
                    >
                      <option value="Immediate">Immediate (Within 30 Days)</option>
                      <option value="Within 3 Months">Within 1 – 3 Months</option>
                      <option value="Within 6 Months">Within 3 – 6 Months</option>
                      <option value="Exploring">Early Planning / Feasibility</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="architectural-tag text-[#242622] block mb-1.5">
                    Describe the Space You’re Imagining
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your apartment size, current state, key requirements (e.g. natural daylight, acoustic tranquility, custom storage)..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input text-sm resize-none"
                  />
                </div>

                {/* Optional Floor Plan / Drawing Link */}
                <div>
                  <label className="architectural-tag text-[#5A6057] block mb-1.5">
                    Optional: Floor Plan or Blueprint Link (Drive, Dropbox, CAD)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... (optional)"
                      value={formData.attachmentUrl}
                      onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                      className="input text-sm pl-9"
                    />
                    <FiUploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727A61]" size={16} />
                  </div>
                  <p className="text-[11px] text-[#727A61] mt-1">
                    You can also share blueprints directly with our architects via WhatsApp once we connect.
                  </p>
                </div>

                {status === "error" && errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <FiAlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full btn btn-clay text-sm py-3.5 shadow-md flex items-center justify-center gap-2"
                  >
                    <FiSend size={16} />
                    <span>
                      {status === "submitting"
                        ? "Submitting to Studio..."
                        : "Send Architectural Enquiry"}
                    </span>
                  </button>
                  <p className="text-[11px] text-[#727A61] text-center mt-2">
                    Your information remains strictly confidential with our studio. Zero spam.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
