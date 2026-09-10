"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiSave, FiArrowLeft, FiYoutube } from "react-icons/fi";
import { CloudinaryUpload } from "../../../../components/admin/CloudinaryUpload";
import { adminFetch } from "../../../../lib/api";

export default function NewVideoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail: "",
    videoType: "youtube",
    videoUrl: "",
    category: "Tour",
    status: "draft",
    featured: false,
  });

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setError("");
    if (!form.title.trim() || !form.videoUrl.trim()) {
      setError("A title and hosted video URL are required. Direct video file uploads are not configured yet.");
      return;
    }
    setSaving(true);
    const result = await adminFetch("videos", { method: "POST", body: JSON.stringify({
      title: form.title.trim(), youtube_url: form.videoUrl.trim(), description: form.description.trim() || null,
      thumbnail: form.thumbnail || null, featured: form.featured, display_order: 0,
      published: form.status === "published",
    }) });
    setSaving(false);
    if (result.success) router.push("/admin/videos"); else setError(result.error || "Unable to save video.");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/videos" className="text-xs text-[#5A625A] hover:text-[#242824] flex items-center gap-1 mb-2 transition-colors">
            <FiArrowLeft size={14} /> Back to videos
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Add Video</h1>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="px-5 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
        >
          <FiSave size={16} /> {saving ? "Saving..." : "Save Video"}
        </button>
      </div>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Video Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Modern Kitchen Tour"
                required
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="Describe what the video is about..."
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs resize-none"
              />
            </div>
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Video Source</h3>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Source Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "youtube", label: "YouTube" },
                  { id: "vimeo", label: "Vimeo" },
                  { id: "upload", label: "Upload" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm({ ...form, videoType: type.id })}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      form.videoType === type.id
                        ? "border-[#586348] bg-[#EDF1EA] text-[#444D37] shadow-2xs"
                        : "border-[#DED5C7] bg-white text-[#5A625A] hover:bg-[#F5F2EB] hover:text-[#242824]"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {form.videoType === "upload" ? "Upload Video File" : "Video URL"}
                {form.videoType === "youtube" && <FiYoutube className="text-red-600" size={14} />}
              </label>
              {form.videoType === "upload" ? (
                <div className="border-2 border-dashed border-[#DED5C7] rounded-2xl p-6 text-center bg-[#F5F2EB]/50">
                  <FiYoutube className="mx-auto text-[#586348] mb-2" size={28} />
                  <p className="text-sm font-semibold text-[#242824]">Direct video uploads are coming soon.</p>
                  <p className="text-xs text-[#5A625A] mt-1">Host the video on YouTube or Vimeo, then paste its URL below.</p>
                  <button type="button" onClick={() => setForm({ ...form, videoType: "youtube" })} className="mt-3 text-xs font-semibold text-[#586348] hover:text-[#444D37] underline">Use a hosted video URL</button>
                </div>
              ) : (
                <input
                  required
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder={form.videoType === "youtube" ? "https://youtube.com/watch?v=..." : "https://vimeo.com/..."}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs font-mono"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Thumbnail</h3>
            <CloudinaryUpload
              value={form.thumbnail}
              onChange={(thumbnail) => setForm({ ...form, thumbnail })}
              folder="banglasketch/videos"
              label=""
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Settings</h3>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              >
                <option>Tour</option>
                <option>Timelapse</option>
                <option>Tips</option>
                <option>Vlog</option>
                <option>Behind the Scenes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-sm text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-2xs"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded text-[#586348] focus:ring-[#586348] border-[#DED5C7] accent-[#586348]"
              />
              <span className="text-xs font-semibold text-[#242824]">Featured video</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
