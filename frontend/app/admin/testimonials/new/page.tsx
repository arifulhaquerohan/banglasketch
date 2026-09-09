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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/testimonials" className="text-sm text-gray-400 hover:text-[#c5a059] flex items-center gap-1 mb-2">
            <FiArrowLeft size={14} /> Back to testimonials
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Add Testimonial</h1>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"
        >
          <FiSave size={16} /> {saving ? "Saving..." : "Save Testimonial"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sarah Johnson"
                required
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location / Role</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Homeowner, Gulshan, Dhaka"
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Testimonial Quote</label>
            <textarea
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              rows={5}
              placeholder="Share what the client said about the service..."
              required
              className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, rating: i + 1 })}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <FiStar
                    size={28}
                    className={i < form.rating ? "text-[#c5a059] fill-[#c5a059]" : "text-gray-600"}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-400">{form.rating} / 5</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Client Photo</h3>
          <CloudinaryUpload
            value={form.avatar}
            onChange={(avatar) => setForm({ ...form, avatar })}
            folder="banglasketch/avatars"
            label=""
          />
        </div>

        <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4 accent-[#c5a059]"
            />
            <span className="text-sm text-gray-300">Feature this testimonial on home page</span>
          </label>
        </div>
      </form>
    </div>
  );
}
