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
  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><FiRefreshCw className="animate-spin text-[#c5a059]" size={28}/></div>;
  if (!form.title) return <div className="space-y-4"><p role="alert" className="text-red-300">{error || "Post not found."}</p><Link href="/admin/blog" className="btn btn-secondary">Back to Blog</Link></div>;
  return <div className="space-y-6 max-w-5xl"><div className="flex items-center justify-between gap-4"><div><Link href="/admin/blog" className="text-sm text-gray-400 hover:text-[#c5a059] flex items-center gap-1 mb-2"><FiArrowLeft size={14}/> Back to blog</Link><h1 className="text-2xl font-extrabold text-white">Edit Post</h1></div><div className="flex gap-2"><button type="button" onClick={() => setHistoryOpen(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-[#c5a059]/30 text-[#c5a059] hover:bg-[#c5a059]/10"><FiClock size={16}/> History</button><button type="button" onClick={remove} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50"><FiTrash2 size={16}/> Delete</button><button type="button" onClick={() => save()} disabled={saving} className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"><FiSave size={16}/> {saving ? "Saving..." : "Update Post"}</button></div></div>{error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}<VersionHistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} entity="blog_posts" entityId={params.id} onRestored={load} /><form onSubmit={save} className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6"><div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-2">Title</label><input required value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">Slug</label><input required value={form.slug} onChange={(e) => setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-")})} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none font-mono"/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label><textarea value={form.excerpt} onChange={(e) => setForm({...form,excerpt:e.target.value})} rows={2} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none resize-none"/></div><RichTextEditor value={form.content} onChange={(content) => setForm({...form,content})} label="Content"/></div><div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4"><h2 className="text-lg font-bold text-white">SEO</h2><div><label className="block text-sm font-medium text-gray-300 mb-2">Meta Description</label><textarea value={form.seoDescription} onChange={(e) => setForm({...form,seoDescription:e.target.value})} rows={3} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none resize-none"/></div></div></div><div className="space-y-6"><div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4"><h2 className="text-lg font-bold text-white">Cover Image</h2><CloudinaryUpload value={form.coverImage} onChange={(coverImage) => setForm({...form,coverImage})} folder="banglasketch/blog" label=""/></div><div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4"><h2 className="text-lg font-bold text-white">Settings</h2><div><label className="block text-sm font-medium text-gray-300 mb-2">Category</label><input value={form.category} onChange={(e) => setForm({...form,category:e.target.value})} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">Tags</label><input value={form.tags} onChange={(e) => setForm({...form,tags:e.target.value})} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">Status</label><select value={form.status} onChange={(e) => setForm({...form,status:e.target.value as "draft" | "published"})} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"><option value="draft">Draft</option><option value="published">Published</option></select></div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form,featured:e.target.checked})} className="w-4 h-4 accent-[#c5a059]"/><span className="text-sm text-gray-300">Featured post</span></label></div></div></form></div>;
}
