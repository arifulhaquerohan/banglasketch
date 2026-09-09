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
        <FiRefreshCw className="animate-spin text-[#c5a059]" size={28} />
      </div>
    );
  }

  if (!form.name) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-red-300">{error || "Testimonial not found."}</p>
        <Link href="/admin/testimonials" className="btn btn-secondary">Back to Testimonials</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/testimonials" className="text-sm text-gray-400 hover:text-[#c5a059] flex items-center gap-1 mb-2">
            <FiArrowLeft size={14} /> Back to testimonials
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Edit Testimonial</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <FiTrash2 size={16} /> Delete
          </button>
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"
          >
            <FiSave size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={save} className="space-y-6">
        <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location / Role</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quote</label>
            <textarea
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              rows={5}
              required
              className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none resize-none"
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
