"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiSave, FiArrowLeft, FiTrash2, FiStar, FiRefreshCw } from "react-icons/fi";
import { CloudinaryUpload } from "../../../../components/admin/CloudinaryUpload";
import { adminFetch, Testimonial } from "../../../../lib/api";

interface FormState {
  name: string;
  location: string;
  quote: string;
  rating: number;
  avatar: string;
  featured: boolean;
}

const empty: FormState = {
  name: "",
  location: "",
  quote: "",
  rating: 5,
  avatar: "",
  featured: false,
};

export default function EditTestimonialPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError("");
    const result = await adminFetch<Testimonial[]>("testimonials");
    const item = result.data?.find((t) => String(t.id) === String(params.id));
    if (!item) {
      setError(result.error || "Testimonial not found.");
    } else {
      setForm({
        name: item.client_name || item.name || "",
        location: item.client_location || item.role || "",
        quote: item.quote || item.content || "",
        rating: Number(item.rating) || 5,
        avatar: item.client_image || item.avatar || "",
        featured: Boolean(item.featured),
      });
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    if (!form.name.trim() || !form.quote.trim()) {
      setError("Client name and quote are required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await adminFetch(`testimonials/${params.id}`, {
      method: "PUT",
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

  const remove = async () => {
    if (!window.confirm(`Delete review from “${form.name}”?`)) return;
    setSaving(true);
    const result = await adminFetch(`testimonials/${params.id}`, { method: "DELETE" });
    setSaving(false);
    if (result.success) {
      router.push("/admin/testimonials");
    } else {
      setError(result.error || "Unable to delete testimonial.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FiRefreshCw className="animate-spin text-[#586348]" size={28} />
      </div>
    );
  }

  if (!form.name) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <p role="alert" className="text-sm text-red-600 font-medium">
          {error || "Testimonial not found."}
        </p>
        <Link
          href="/admin/testimonials"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] text-xs font-semibold text-[#242824] hover:border-[#586348]"
        >
          <FiArrowLeft size={14} /> Back to Testimonials
        </Link>
      </div>
    );
  }

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
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Edit Testimonial</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <FiTrash2 size={14} /> Delete
          </button>
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="px-5 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            <FiSave size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={save} className="grid lg:grid-cols-3 gap-6">
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
                  required
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Location / Role</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Review / Testimonial Quote</label>
              <textarea
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                rows={5}
                required
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs resize-none leading-relaxed"
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
