"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiSave, FiArrowLeft, FiTrash2, FiRefreshCw, FiClock } from "react-icons/fi";
import { CloudinaryUpload } from "../../../../components/admin/CloudinaryUpload";
import { RichTextEditor } from "../../../../components/admin/RichTextEditor";
import { adminFetch, BlogPost } from "../../../../lib/api";
import VersionHistoryModal from "../../../../components/admin/VersionHistoryModal";

interface FormState { title: string; slug: string; excerpt: string; content: string; coverImage: string; category: string; tags: string; status: "draft" | "published"; seoDescription: string; featured: boolean; }
const empty: FormState = { title: "", slug: "", excerpt: "", content: "", coverImage: "", category: "Design Tips", tags: "", status: "draft", seoDescription: "", featured: false };

export default function EditBlogPage() {
  const params = useParams<{ id: string }>(); const router = useRouter();
  const [form, setForm] = useState<FormState>(empty); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError("");
    const result = await adminFetch<BlogPost[]>("blog");
    const post = result.data?.find((item) => String(item.id) === String(params.id));
    if (!post) setError(result.error || "Post not found.");
    else
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content || "",
        coverImage: post.featured_image || post.coverImage || "",
        category: post.category,
        tags: (post.tags || []).join(", "),
        status: post.published ? "published" : "draft",
        seoDescription: post.meta_description || "",
        featured: Boolean(post.featured),
      });
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);
  const save = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    if (!form.title.trim() || !form.content.trim()) {
      setError("A title and article content are required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await adminFetch(`blog/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || form.content.slice(0, 180),
        content: form.content,
        featured_image: form.coverImage || null,
        category: form.category,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        meta_description: form.seoDescription || null,
        featured: form.featured,
        published: form.status === "published",
      }),
    });
    setSaving(false);
    if (result.success) router.push("/admin/blog");
    else setError(result.error || "Unable to save post.");
  };
  const remove = async () => { if (!window.confirm(`Move “${form.title}” to Recycle Bin? It can be restored later.`)) return; setSaving(true); const result = await adminFetch(`blog/${params.id}`, { method: "DELETE" }); setSaving(false); if (result.success) router.push("/admin/blog"); else setError(result.error || "Unable to delete post."); };
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FiRefreshCw className="animate-spin text-[#586348]" size={28} />
      </div>
    );
  }

  if (!form.title) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <p role="alert" className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-2xl p-4">
          {error || "Post not found."}
        </p>
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] text-xs font-semibold text-[#242824] hover:border-[#586348]"
        >
          <FiArrowLeft size={14} /> Back to Blog
        </Link>
      </div>
    );
  }

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
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Edit Post</h1>
          <p className="text-sm text-[#5A625A] mt-0.5">Revise article text, SEO settings, and media.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-[#DED5C7] bg-[#FCFAF7] text-[#586348] hover:bg-[#F5F2EB] hover:border-[#586348] transition-colors shadow-xs"
          >
            <FiClock size={14} /> Revisions
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 transition-colors disabled:opacity-50 shadow-xs"
          >
            <FiTrash2 size={14} /> Delete
          </button>
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <FiSave size={15} /> {saving ? "Saving..." : "Update Post"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      <VersionHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entity="blog_posts"
        entityId={params.id}
        onRestored={load}
      />

      <form onSubmit={save} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Article Content</h2>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Title
              </label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Slug
              </label>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all font-mono shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Excerpt
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all resize-none shadow-2xs leading-relaxed"
              />
            </div>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              label="Content Narrative"
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">SEO Settings</h2>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Meta Description
              </label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                rows={3}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all resize-none shadow-2xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Cover Showcase</h2>
            <CloudinaryUpload
              value={form.coverImage}
              onChange={(coverImage) => setForm({ ...form, coverImage })}
              folder="banglasketch/blog"
              label=""
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Classification</h2>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Tags
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              />
              <p className="text-[11px] text-[#737D73] mt-1">Separate keywords with commas</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
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
