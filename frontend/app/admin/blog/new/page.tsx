"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiSave, FiArrowLeft, FiCalendar } from "react-icons/fi";
import { CloudinaryUpload } from "../../../../components/admin/CloudinaryUpload";
import { RichTextEditor } from "../../../../components/admin/RichTextEditor";
import { adminFetch } from "../../../../lib/api";

export default function NewBlogPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "Design Tips",
    tags: "",
    status: "draft",
    scheduledAt: "",
    featured: false,
    seoTitle: "",
    seoDescription: "",
  });

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setError("");
    if (!form.title.trim() || !form.content.trim()) {
      setError("A title and article content are required.");
      return;
    }
    const slug = form.slug.trim() || form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setSaving(true);
    const result = await adminFetch("blog", { method: "POST", body: JSON.stringify({
      title: form.title.trim(), slug, excerpt: form.excerpt.trim() || form.content.trim().slice(0, 180),
      content: form.content, featured_image: form.coverImage || null, category: form.category,
      meta_description: form.seoDescription.trim() || null,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      scheduled_publish_date: form.status === "scheduled" && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      featured: form.featured, published: form.status === "published",
    }) });
    setSaving(false);
    if (result.success) router.push("/admin/blog"); else setError(result.error || "Unable to save article.");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/blog"
            className="text-xs font-semibold text-[#5A625A] hover:text-[#586348] inline-flex items-center gap-1.5 mb-2 transition-colors"
          >
            <FiArrowLeft size={14} /> Back to blog
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Write New Post</h1>
          <p className="text-sm text-[#5A625A] mt-0.5">Author an architectural essay, insight piece, or project case study.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setForm({ ...form, status: "draft" })}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-[#DED5C7] bg-[#FCFAF7] text-[#242824] hover:bg-[#EDE7DE] transition-colors shadow-xs"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <FiSave size={15} /> {saving ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Article Content</h2>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Post Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Modern Minimalist Interiors in Urban Dhaka"
                required
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                URL Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                placeholder="modern-minimalist-interiors"
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all font-mono shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Excerpt / Summary
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                placeholder="Brief teaser shown in article cards and social previews..."
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all resize-none shadow-2xs leading-relaxed"
              />
            </div>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              label="Body Narrative"
              placeholder="Start drafting your architectural article..."
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Search Engine Optimization (SEO)</h3>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Meta Title
              </label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                placeholder="Optimized headline for search engines"
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Meta Description
              </label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                rows={2}
                placeholder="Concise description shown in Google search result cards..."
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all resize-none shadow-2xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Cover Showcase</h3>
            <CloudinaryUpload
              value={form.coverImage}
              onChange={(coverImage) => setForm({ ...form, coverImage })}
              folder="banglasketch/blog"
              label=""
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Topic & Classification</h3>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              >
                <option>Design Tips</option>
                <option>Color Theory</option>
                <option>Small Spaces</option>
                <option>Sustainability</option>
                <option>Budget Tips</option>
                <option>Culture</option>
                <option>Behind the Scenes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Tags
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. minimalist, interior, oak"
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              />
              <p className="text-[11px] text-[#737D73] mt-1">Separate keywords with commas</p>
            </div>
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Publishing Status</h3>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {form.status === "scheduled" && (
              <div>
                <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiCalendar size={13} /> Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
                />
              </div>
            )}
            <label className="flex items-center gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-[#586348] rounded"
              />
              <span className="text-xs font-medium text-[#242824]">Featured in journal highlights</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
