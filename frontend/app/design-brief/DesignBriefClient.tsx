"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBookmark,
  FiCheck,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiLayers,
  FiMapPin,
  FiSend,
  FiTrash2,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useSpaceCollection } from "../../components/SpaceCollectionContext";

const LIFESTYLE_PRIORITIES = [
  "Acoustic isolation from arterial road noise",
  "Circadian 2400K indirect nocturnal illumination",
  "High-heat dual kitchen (Wet & Dry with downdraft)",
  "Seamless floor-to-ceiling concealed joinery",
  "Children-safe rounded architectural profiles",
  "Dedicated serene prayer / meditation niche",
  "Deep recessed live-edge dining table area",
  "Walk-in wardrobe with climate moisture control",
  "Biophilic balcony garden integration",
  "Home studio / acoustic Zoom pod",
];

export default function DesignBriefClient() {
  const searchParams = useSearchParams();
  const initialScope = searchParams.get("scope") || "entire-home";

  const { items, removeItem, clearCollection, totalCount } = useSpaceCollection();

  const [scope, setScope] = useState(initialScope);
  const [location, setLocation] = useState("Gulshan II");
  const [approxArea, setApproxArea] = useState("3200");
  const [handoverState, setHandoverState] = useState("Handover Within 6 Months");
  const [budgetRange, setBudgetRange] = useState("Premium Architectural (40L - 80L BDT)");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    "Acoustic isolation from arterial road noise",
    "Seamless floor-to-ceiling concealed joinery",
    "High-heat dual kitchen (Wet & Dry with downdraft)",
  ]);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("scope")) {
      setScope(searchParams.get("scope")!);
    }
  }, [searchParams]);

  const togglePriority = (p: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const briefSummary = `
--- ARCHITECTURAL DESIGN BRIEF ---
Scope: ${scope}
Location: ${location}, Dhaka
Approx Area: ${approxArea} sq.ft
Handover State: ${handoverState}
Budget Range: ${budgetRange}
Priorities: ${selectedPriorities.join("; ")}
Attached Collection (${items.length} items):
${items.map((i) => `- [${i.type.toUpperCase()}] ${i.title} (${i.subtitle || ""})`).join("\n")}
Client Notes: ${specialNotes}
----------------------------------
    `.trim();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          message: briefSummary,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to register design brief. Please try again or share via WhatsApp.");
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unable to register design brief. Please try again or share via WhatsApp.");
    }
  };

  const generateWhatsAppMessage = () => {
    const text = `Hello Bangla Sketch studio, I generated an Architectural Design Brief:
Scope: ${scope}
Location: ${location}, Dhaka (${approxArea} sq.ft)
Priorities: ${selectedPriorities.slice(0, 3).join(", ")}
Saved Items: ${totalCount} references attached.
My Name: ${contactName || "Prospective Client"}`;
    return encodeURIComponent(text);
  };

  return (
    <div className="min-h-screen bg-[#F4F0E8] pt-32 pb-24 border-b border-[#DDD5C8]">
      <div className="container max-w-6xl">
        {/* Breadcrumb & Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#727A61] hover:text-[#242622] transition-colors"
          >
            <FiArrowLeft size={14} />
            <span>Return to Studio Home</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#727A61]">
            <span className="w-2 h-2 rounded-full bg-[#A45138]" />
            <span>ARCHITECTURAL DOSSIER BUILDER</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DDD5C8] text-[11px] font-semibold tracking-widest uppercase text-[#727A61] mb-3">
            <FiFileText className="text-[#A45138]" />
            <span>Tailored Spatial Vision</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242622] tracking-tight leading-[1.15]">
            Your Personalized Architectural Brief
          </h1>
          <p className="text-base text-[#5A6057] mt-3 leading-relaxed">
            Translate your floor requirements, daily lifestyle rituals, and saved Space Collection into a cohesive brief. Our studio architects use this document to formulate your spatial strategy and fixed-price scope.
          </p>
        </div>

        {status === "success" ? (
          /* Submission Success View */
          <div className="bg-[#FAF7F2] p-8 sm:p-14 rounded-2xl border border-[#DDD5C8] text-center space-y-6 max-w-2xl mx-auto shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#EEF1EA] border border-[#D0D6C7] flex items-center justify-center text-[#727A61] mx-auto">
              <FiCheckCircle size={32} />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-[#242622]">
              Design Brief Registered
            </h2>
            <p className="text-sm text-[#5A6057] leading-relaxed">
              Thank you, {contactName || "Client"}. Your spatial brief containing your {approxArea} sq.ft {scope} parameters and {totalCount} saved aesthetic references has been delivered directly to our senior project architect.
            </p>
            <div className="p-4 rounded-xl bg-[#F4F0E8] border border-[#DDD5C8] text-left font-mono text-xs text-[#5A6057] space-y-1.5">
              <p>• Review turnaround: Within 24 business hours</p>
              <p>• Location: {location}, Dhaka</p>
              <p>• Handover target: {handoverState}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href={`https://wa.me/8801712458794?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-clay text-xs px-6 py-3 flex items-center gap-2"
              >
                <FaWhatsapp size={16} />
                <span>Instant WhatsApp Transmission</span>
              </a>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary text-xs px-6 py-3 flex items-center gap-2"
              >
                <FiDownload size={15} />
                <span>Print Architectural Dossier</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Interactive Dossier Form */
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* Left 8 Columns: Interactive Form Sections */}
            <div className="lg:col-span-8 space-y-8">
              {/* Section 1: Scope & Spatial Parameters */}
              <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#DDD5C8] space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-[#DDD5C8]">
                  <span className="w-5 h-5 rounded-full bg-[#242622] text-[#FAF7F2] font-mono text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-[#242622]">
                    Scope & Spatial Coordinates
                  </h3>
                </div>

                {/* Scope Radio Cards */}
                <div>
                  <label className="architectural-tag text-[#242622] block mb-2">
                    Select Scope of Work
                  </label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { id: "entire-home", label: "Entire Residence", note: "Turnkey Architecture" },
                      { id: "one-room", label: "Individual Zone", note: "Kitchen / Suite / Living" },
                      { id: "renovation", label: "Full Remodel", note: "Structural Overhaul" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setScope(item.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          scope === item.id
                            ? "bg-[#242622] text-white border-[#242622] shadow-md"
                            : "bg-[#F4F0E8] text-[#242622] border-[#DDD5C8] hover:border-[#727A61]"
                        }`}
                      >
                        <div className="font-serif text-sm font-semibold">{item.label}</div>
                        <div
                          className={`text-[11px] font-mono mt-0.5 ${
                            scope === item.id ? "text-[#DDD5C8]" : "text-[#727A61]"
                          }`}
                        >
                          {item.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Parameters Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Property Location (Dhaka)
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="input text-sm"
                    >
                      <option value="Gulshan I / II">Gulshan I / II</option>
                      <option value="Banani">Banani</option>
                      <option value="Baridhara">Baridhara / Baridhara DOHS</option>
                      <option value="Dhanmondi">Dhanmondi</option>
                      <option value="Uttara">Uttara</option>
                      <option value="Bashundhara R/A">Bashundhara R/A</option>
                      <option value="Other Location">Other Area</option>
                    </select>
                  </div>

                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Approximate Area (Sq.Ft)
                    </label>
                    <input
                      type="number"
                      value={approxArea}
                      onChange={(e) => setApproxArea(e.target.value)}
                      placeholder="e.g. 3400"
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Apartment Status / Timeline
                    </label>
                    <select
                      value={handoverState}
                      onChange={(e) => setHandoverState(e.target.value)}
                      className="input text-sm"
                    >
                      <option value="Ready for Immediate Fit-Out">Ready for Immediate Fit-Out</option>
                      <option value="Handover Within 3 Months">Handover Within 3 Months</option>
                      <option value="Handover Within 6 Months">Handover Within 6 Months</option>
                      <option value="Under Construction / Blueprint Stage">Under Construction / Blueprint Stage</option>
                    </select>
                  </div>

                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Target Investment Band
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="input text-sm"
                    >
                      <option value="Essential Turnkey (25L - 40L BDT)">Essential Turnkey (25L - 40L BDT)</option>
                      <option value="Premium Architectural (40L - 80L BDT)">Premium Architectural (40L - 80L BDT)</option>
                      <option value="Bespoke Luxury Atelier (80L+ BDT)">Bespoke Luxury Atelier (80L+ BDT)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Lifestyle Priorities */}
              <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#DDD5C8] space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#DDD5C8]">
                  <span className="w-5 h-5 rounded-full bg-[#242622] text-[#FAF7F2] font-mono text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-[#242622]">
                    Living Rituals & Spatial Priorities
                  </h3>
                </div>
                <p className="text-xs text-[#5A6057]">
                  Select the lifestyle nuances that will shape the acoustic, daylight, and ergonomic design of your home:
                </p>

                <div className="grid sm:grid-cols-2 gap-2.5 pt-2">
                  {LIFESTYLE_PRIORITIES.map((priority) => {
                    const isSelected = selectedPriorities.includes(priority);
                    return (
                      <div
                        key={priority}
                        onClick={() => togglePriority(priority)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-[#F4F0E8] border-[#A45138] text-[#242622] shadow-sm font-medium"
                            : "bg-[#FAF7F2] border-[#DDD5C8] text-[#5A6057] hover:border-[#727A61]"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-colors ${
                            isSelected
                              ? "bg-[#A45138] border-[#A45138] text-white"
                              : "border-[#DDD5C8]"
                          }`}
                        >
                          {isSelected && <FiCheck size={11} />}
                        </div>
                        <span className="leading-snug">{priority}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Attached Space Collection */}
              <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#DDD5C8] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C8]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#242622] text-[#FAF7F2] font-mono text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-[#242622]">
                      Attached Space Collection References ({totalCount})
                    </h3>
                  </div>

                  {totalCount > 0 && (
                    <button
                      onClick={clearCollection}
                      className="text-xs text-[#A45138] hover:underline flex items-center gap-1"
                    >
                      <FiTrash2 size={12} /> Clear all
                    </button>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#F4F0E8] border border-dashed border-[#DDD5C8] space-y-2">
                    <FiBookmark className="mx-auto text-[#727A61]" size={24} />
                    <p className="text-xs text-[#5A6057]">
                      No rooms or material swatches saved yet. You can bookmark items while browsing the floor plans and material moods.
                    </p>
                    <Link
                      href="/#materials"
                      className="inline-block text-xs font-semibold text-[#A45138] hover:underline mt-1"
                    >
                      Browse Material Moods →
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-[#F4F0E8] border border-[#DDD5C8] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#DDD5C8]">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : item.hex ? (
                            <div
                              className="w-10 h-10 rounded-lg shrink-0 border border-black/15 shadow-inner"
                              style={{ backgroundColor: item.hex }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#DDD5C8] flex items-center justify-center shrink-0">
                              <FiLayers size={14} className="text-[#242622]" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="font-serif text-xs font-semibold text-[#242622] truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-[#727A61] truncate">
                              {item.subtitle || item.type}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#5A6057] hover:text-[#A45138] p-1.5 shrink-0"
                          title="Remove reference"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Contact & Studio Dispatch */}
              <form onSubmit={handleSubmit} className="bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#DDD5C8] space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-[#DDD5C8]">
                  <span className="w-5 h-5 rounded-full bg-[#242622] text-[#FAF7F2] font-mono text-xs flex items-center justify-center">
                    4
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-[#242622]">
                    Submit Brief to Studio Architects
                  </h3>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanzim Ahmed"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      WhatsApp / Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+880 1712-458794"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="architectural-tag text-[#242622] block mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="architectural-tag text-[#242622] block mb-1.5">
                    Additional Architectural Vision or Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any specific architect or builder details, current floor plan state, or personal aesthetic requirements..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="input text-sm resize-none"
                  />
                </div>

                {status === "error" && errorMessage && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                    <FiAlertCircle size={18} className="shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full btn btn-clay text-sm py-4 shadow-md flex items-center justify-center gap-2"
                  >
                    <FiSend size={15} />
                    <span>
                      {status === "submitting"
                        ? "Transmitting to Studio Architectural Team..."
                        : "Submit Architectural Brief for Review"}
                    </span>
                  </button>
                  <p className="text-[11px] text-[#727A61] text-center mt-2.5">
                    Your brief remains strictly confidential within Bangla Sketch Studio.
                  </p>
                </div>
              </form>
            </div>

            {/* Right 4 Columns: Sticky Live Dossier Summary */}
            <div className="lg:col-span-4 sticky top-28 space-y-6">
              <div className="bg-[#242622] text-white p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="architectural-tag text-[#DDD5C8]">Live Dossier Summary</span>
                  <span className="text-[10px] font-mono text-[#A45138] uppercase">CONFIDENTIAL</span>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-mono text-[#727A61]">PROJECT NATURE</div>
                  <h4 className="font-serif text-xl font-medium text-white capitalize mt-0.5">
                    {scope.replace("-", " ")}
                  </h4>
                  <p className="text-xs text-[#DDD5C8] font-mono mt-1 flex items-center gap-1">
                    <FiMapPin size={11} className="text-[#A45138]" /> {location} • {approxArea} sq.ft
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#727A61]">Timeline:</span>
                    <span className="text-[#DDD5C8] font-mono truncate max-w-[170px]">
                      {handoverState}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#727A61]">Attached Refs:</span>
                    <span className="text-[#A45138] font-mono font-bold">{totalCount} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#727A61]">Key Priorities:</span>
                    <span className="text-[#DDD5C8] font-mono font-bold">
                      {selectedPriorities.length} selected
                    </span>
                  </div>
                </div>

                {selectedPriorities.length > 0 && (
                  <div className="pt-3 border-t border-white/10">
                    <span className="text-[10px] font-mono text-[#727A61] uppercase block mb-1.5">
                      Selected Rituals
                    </span>
                    <div className="space-y-1">
                      {selectedPriorities.slice(0, 3).map((p, i) => (
                        <div key={i} className="text-[11px] text-[#DDD5C8] flex items-center gap-1.5 truncate">
                          <span className="w-1 h-1 rounded-full bg-[#A45138]" />
                          <span className="truncate">{p}</span>
                        </div>
                      ))}
                      {selectedPriorities.length > 3 && (
                        <span className="text-[10px] text-[#727A61] block">
                          +{selectedPriorities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10">
                  <a
                    href={`https://wa.me/8801712458794?text=${generateWhatsAppMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn btn-whatsapp text-xs py-3 flex items-center justify-center gap-2"
                  >
                    <FaWhatsapp size={15} />
                    <span>Share Directly via WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Studio Guarantee Mini Badge */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#DDD5C8] text-xs text-[#5A6057] space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-[#242622]">
                  <FiCheckCircle className="text-[#727A61]" size={14} />
                  <span>Turnkey Architectural Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Every project parameter specified in this brief is translated into a 100% itemized Bill of Quantities (BOQ) with zero hidden cost surprises.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
