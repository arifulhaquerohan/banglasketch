"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiSave, FiArrowLeft, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { CloudinaryUpload } from "../../../../components/admin/CloudinaryUpload";
import { adminFetch, Video } from "../../../../lib/api";

interface FormState { title: string; description: string; thumbnail: string; videoUrl: string; status: "draft" | "published"; featured: boolean; displayOrder: string; }
const empty: FormState = { title: "", description: "", thumbnail: "", videoUrl: "", status: "draft", featured: false, displayOrder: "0" };

export default function EditVideoPage() {
  const params = useParams<{ id: string }>(); const router = useRouter(); const [form, setForm] = useState<FormState>(empty); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    const result = await adminFetch<Video[]>("videos");
    const video = result.data?.find((item) => String(item.id) === String(params.id));
    if (!video) setError(result.error || "Video not found.");
    else
      setForm({
        title: video.title,
        description: video.description || "",
        thumbnail: video.thumbnail || "",
        videoUrl: video.youtube_url || video.youtubeUrl || "",
        status: video.published ? "published" : "draft",
        featured: Boolean(video.featured),
        displayOrder: String(video.display_order || 0),
      });
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);
  const save = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    if (!form.title.trim() || !form.videoUrl.trim()) {
      setError("A title and hosted video URL are required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await adminFetch(`videos/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        thumbnail: form.thumbnail || null,
        youtube_url: form.videoUrl.trim(),
        display_order: Number(form.displayOrder) || 0,
        featured: form.featured,
        published: form.status === "published",
      }),
    });
    setSaving(false);
    if (result.success) router.push("/admin/videos");
    else setError(result.error || "Unable to save video.");
  };
  const remove = async () => { if (!window.confirm(`Delete “${form.title}”?`)) return; setSaving(true); const result = await adminFetch(`videos/${params.id}`, { method: "DELETE" }); setSaving(false); if (result.success) router.push("/admin/videos"); else setError(result.error || "Unable to delete video."); };
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
        <p role="alert" className="text-sm text-red-600 font-medium">
          {error || "Video not found."}
        </p>
        <Link
          href="/admin/videos"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] text-xs font-semibold text-[#242824] hover:border-[#586348]"
        >
          <FiArrowLeft size={14} /> Back to Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/videos"
            className="text-xs text-[#5A625A] hover:text-[#242824] flex items-center gap-1 mb-2 transition-colors"
          >
            <FiArrowLeft size={14} /> Back to videos
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Edit Video</h1>
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
            <FiSave size={16} /> {saving ? "Saving..." : "Update Video"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={save} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Hosted Video URL</label>
              <input
                required
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Thumbnail</h2>
            <CloudinaryUpload
              value={form.thumbnail}
              onChange={(thumbnail) => setForm({ ...form, thumbnail })}
              folder="banglasketch/videos"
              label=""
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Settings</h2>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Display Order</label>
              <input
                type="number"
                min="0"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded text-[#586348] focus:ring-[#586348] border-[#DED5C7] accent-[#586348]"
              />
              <span className="text-xs font-semibold text-[#242824]">Featured</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
