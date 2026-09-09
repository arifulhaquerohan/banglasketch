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
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/blog" className="text-sm text-gray-400 hover:text-[#c5a059] flex items-center gap-1 mb-2">
            <FiArrowLeft size={14} /> Back to blog
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Write New Post</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, status: "draft" })}
            className="px-4 py-2.5 text-sm rounded-xl border border-[#c5a059]/20 text-gray-300 hover:bg-[#1a3a5c]"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"
          >
            <FiSave size={16} /> {saving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Post Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="An amazing blog post title"
                required
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                placeholder="my-awesome-post"
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                placeholder="Brief excerpt shown in blog list..."
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none resize-none"
              />
            </div>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              label="Post Content"
              placeholder="Start writing your post..."
            />
          </div>

          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">SEO Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Meta Title</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                placeholder="Optimized title for search engines"
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Meta Description</label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                rows={2}
                placeholder="Brief description for search results"
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Cover Image</h3>
            <CloudinaryUpload
              value={form.coverImage}
              onChange={(coverImage) => setForm({ ...form, coverImage })}
              folder="banglasketch/blog"
              label=""
            />
          </div>

          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Categories & Tags</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="design, interior, modern"
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>
          </div>

          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Publish</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {form.status === "scheduled" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                  <FiCalendar size={12} /> Schedule Date
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
                />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-[#c5a059]"
              />
              <span className="text-sm text-gray-300">Featured post</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
