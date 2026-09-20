"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FiArrowUpRight, FiMapPin, FiCalendar, FiMessageSquare, FiCheck, FiSend, FiX } from "react-icons/fi";
import type { ServiceCategory } from "../lib/constants";
import { getOptimizedCloudinaryUrl } from "../lib/cloudinary";

interface ProjectCardProps {
  title: string;
  slug: string;
  category: ServiceCategory;
  description?: string;
  location?: string;
  area?: string;
  style?: string;
  year?: string;
  featuredImage?: string;
  dateCompleted?: string;
}

const LABELS: Record<ServiceCategory, string> = {
  kitchen: "Kitchen",
  bedroom: "Bedroom",
  "living-room": "Living",
  bathroom: "Bathroom",
  commercial: "Commercial",
};

export function ProjectCard({
  title,
  slug,
  category,
  description,
  location = "Dhaka, Bangladesh",
  area = "Bespoke Residence",
  style = "Quiet Luxury",
  year = "2026",
  featuredImage,
}: ProjectCardProps) {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const rawImg = featuredImage || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85";
  const img = getOptimizedCloudinaryUrl(rawImg, { width: 1200, quality: "auto:good" });

  const handleQuickEnquire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName.trim(),
          email: clientEmail.trim(),
          phone: clientPhone.trim(),
          message: `[Project Inquiry: ${title} (${LABELS[category] || category}) | Location: ${location} | Style: ${style}]`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to send your enquiry.");
      }
      setSubmitted(true);
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to send your enquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="card group flex flex-col justify-between overflow-hidden bg-[#FAF7F2] border border-[#DDD5C8] hover:border-[#727A61] transition-all duration-200">
      {/* 1. Large Project Image with Hover Zoom */}
      <Link href={`/portfolio/${slug}`} className="block relative aspect-[16/10] overflow-hidden bg-[#EAE3D5]">
        {img ? (
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 650px"
            className="object-cover transition-transform duration-220 ease-out group-hover:scale-[1.035]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#242622]/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-200" />

        {/* Category Pill Tag */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="badge bg-[#FAF7F2]/95 backdrop-blur-xs text-[#575E4A] border border-[#DDD5C8] text-[11px] font-semibold tracking-wider uppercase px-3 py-1 shadow-2xs">
            {LABELS[category] || category}
          </span>
        </div>

        {/* View Project Floating Action Indicator */}
        <div className="absolute top-3.5 right-3.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <span className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#242622] flex items-center justify-center shadow-md border border-[#DDD5C8]">
            <FiArrowUpRight size={16} />
          </span>
        </div>

        {/* Bottom Metadata Overlay */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between text-[11.5px] text-[#FAF7F2]">
          <span className="inline-flex items-center gap-1 bg-[#242622]/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 font-medium">
            <FiMapPin size={12} className="text-[#A45138]" /> {location}
          </span>
          <span className="inline-flex items-center gap-1 bg-[#242622]/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 font-medium">
            <FiCalendar size={12} className="text-[#C5A059]" /> {year}
          </span>
        </div>
      </Link>

      {/* 2. Content & Project Attributes */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-[#727A61] font-semibold mb-1.5 font-mono">
            <span>Area: {area}</span>
            <span className="text-[#DDD5C8]">•</span>
            <span>Style: {style}</span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#242622] group-hover:text-[#575E4A] transition-colors duration-200 leading-snug">
            <Link href={`/portfolio/${slug}`}>
              {title}
            </Link>
          </h3>

          {description && (
            <p className="mt-2 text-sm text-[#5A6057] line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* 3. Action Bar with Compact Enquiry Trigger */}
        <div className="mt-5 pt-4 border-t border-[#DDD5C8]/80 flex items-center justify-between gap-3 text-xs">
          <Link
            href={`/portfolio/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#242622] hover:text-[#A45138] transition-colors group/link"
          >
            <span>View projects</span>
            <FiArrowUpRight size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </Link>

          <button
            type="button"
            onClick={() => setEnquiryOpen(!enquiryOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DDD5C8] bg-[#FAF7F2] text-[#575E4A] hover:bg-[#EEF1EA] hover:border-[#727A61] hover:text-[#242622] transition-colors font-medium text-[11px]"
          >
            <FiMessageSquare size={12} className="text-[#A45138]" />
            <span>{enquiryOpen ? "Close enquiry" : "Enquire on this space"}</span>
          </button>
        </div>

        {/* 4. Compact Project Enquiry Panel */}
        {enquiryOpen && (
          <div className="mt-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#727A61]/40 shadow-xs animate-fade-in text-xs text-[#242622]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-[#242622]">
                Enquire about {LABELS[category] || category} Design
              </span>
              <button
                type="button"
                onClick={() => setEnquiryOpen(false)}
                className="text-[#5A6057] hover:text-[#242622]"
                aria-label="Close form"
              >
                <FiX size={14} />
              </button>
            </div>

            {submitted ? (
              <div className="py-3 text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[#575E4A] font-semibold text-xs">
                  <FiCheck size={14} /> Enquiry Received
                </div>
                <p className="text-[11px] text-[#5A6057]">
                  Our lead architect will connect with you via phone/WhatsApp regarding this project direction.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuickEnquire} className="space-y-2.5">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-md border border-[#DDD5C8] bg-white px-2.5 py-1.5 text-xs text-[#242622] outline-none focus:border-[#727A61]"
                  />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Email Address"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full rounded-md border border-[#DDD5C8] bg-white px-2.5 py-1.5 text-xs text-[#242622] outline-none focus:border-[#727A61]"
                  />
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="Phone / WhatsApp"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full rounded-md border border-[#DDD5C8] bg-white px-2.5 py-1.5 text-xs text-[#242622] outline-none focus:border-[#727A61]"
                  />
                </div>
                {submitError && <p role="alert" className="text-[11px] text-red-700">{submitError}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn btn-clay py-2 text-xs flex items-center justify-center gap-1.5 rounded-md"
                >
                  <FiSend size={12} />
                  <span>{submitting ? "Sending..." : "Request Similar Project Estimate"}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
