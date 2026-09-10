"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiSave, FiArrowLeft, FiStar } from "react-icons/fi";
import { CloudinaryUpload } from "../../../../components/admin/CloudinaryUpload";
import { adminFetch } from "../../../../lib/api";

export default function NewTestimonialPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    location: "",
    quote: "",
    rating: 5,
    avatar: "",
    featured: false,
  });

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setError("");
    if (!form.name.trim() || !form.quote.trim()) {
      setError("Client name and quote are required.");
      return;
    }
    setSaving(true);
    const result = await adminFetch("testimonials", {
      method: "POST",
      body: JSON.stringify({
        client_name: form.name.trim(),
        client_location: form.location.trim() || null,
        quote: form.quote.trim(),
        rating: Number(form.rating) || 5,
        client_image: form.avatar || null,
        featured: form.featured,
      }),
    });
    setSaving(false);
    if (result.success) {
      router.push("/admin/testimonials");
    } else {
      setError(result.error || "Unable to save testimonial.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/testimonials"
            className="text-xs text-[#5A625A] hover:text-[#242824] flex items-center gap-1 mb-2 transition-colors"
          >
            <FiArrowLeft size={14} /> Back to testimonials
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Add Testimonial</h1>
          <p className="text-sm text-[#5A625A] mt-1">Publish an authentic client review to build credibility and showcase project outcomes.</p>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="px-5 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
        >
          <FiSave size={16} /> {saving ? "Saving..." : "Save Testimonial"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Client Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Client Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sarah Johnson"
                  required
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Location / Role</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Homeowner, Gulshan, Dhaka"
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Review / Testimonial Quote</label>
              <textarea
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                rows={5}
                placeholder="Share the client's detailed feedback regarding design quality, communication, and execution..."
                required
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs resize-none leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Rating</label>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, rating: i + 1 })}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`Rate ${i + 1} star${i > 0 ? "s" : ""}`}
                  >
                    <FiStar
                      size={24}
                      className={i < form.rating ? "text-amber-500 fill-amber-500" : "text-[#DED5C7]"}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-[#586348] bg-[#EDF1EA] px-2.5 py-1 rounded-lg">
                  {form.rating} of 5 Stars
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Client Avatar</h3>
            <CloudinaryUpload
              value={form.avatar}
              onChange={(avatar) => setForm({ ...form, avatar })}
              folder="banglasketch/avatars"
              label=""
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Settings</h3>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded text-[#586348] focus:ring-[#586348] border-[#DED5C7] accent-[#586348]"
              />
              <span className="text-xs font-semibold text-[#242824]">Feature on studio homepage</span>
            </label>
            <p className="text-[11px] text-[#737D73] leading-relaxed">
              Featured testimonials appear in the primary social proof carousel on the homepage.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
