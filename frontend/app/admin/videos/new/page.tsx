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
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/videos" className="text-sm text-gray-400 hover:text-[#c5a059] flex items-center gap-1 mb-2">
            <FiArrowLeft size={14} /> Back to videos
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Add Video</h1>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"
        >
          <FiSave size={16} /> {saving ? "Saving..." : "Save Video"}
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Video Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Modern Kitchen Tour"
                required
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="Describe what the video is about..."
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Video Source</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Source Type</label>
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
                    className={`px-4 py-2.5 text-sm rounded-xl border transition-all ${
                      form.videoType === type.id
                        ? "border-[#c5a059] bg-[#c5a059]/10 text-[#c5a059]"
                        : "border-[#c5a059]/20 text-gray-400 hover:border-[#c5a059]/50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                {form.videoType === "upload" ? "Upload Video File" : "Video URL"}
                {form.videoType === "youtube" && <FiYoutube className="text-red-500" size={14} />}
              </label>
              {form.videoType === "upload" ? (
                <div className="border-2 border-dashed border-[#c5a059]/20 rounded-xl p-6 text-center">
                  <FiYoutube className="mx-auto text-[#c5a059] mb-2" size={28} />
                  <p className="text-sm text-white">Direct video uploads are coming soon.</p>
                  <p className="text-xs text-gray-400 mt-1">Host the video on YouTube or Vimeo, then paste its URL below.</p>
                  <button type="button" onClick={() => setForm({ ...form, videoType: "youtube" })} className="mt-3 text-xs font-semibold text-[#c5a059] hover:text-[#e07b2a]">Use a hosted video URL</button>
                </div>
              ) : (
                <input
                  required
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder={form.videoType === "youtube" ? "https://youtube.com/watch?v=..." : "https://vimeo.com/..."}
                  className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Thumbnail</h3>
            <CloudinaryUpload
              value={form.thumbnail}
              onChange={(thumbnail) => setForm({ ...form, thumbnail })}
              folder="banglasketch/videos"
              label=""
            />
          </div>

          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
              >
                <option>Tour</option>
                <option>Timelapse</option>
                <option>Tips</option>
                <option>Vlog</option>
                <option>Behind the Scenes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-[#c5a059]"
              />
              <span className="text-sm text-gray-300">Featured video</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
