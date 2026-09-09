"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import { CloudinaryUpload } from "../../../../components/admin/CloudinaryUpload";
import { RichTextEditor } from "../../../../components/admin/RichTextEditor";
import { adminFetch } from "../../../../lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "kitchen",
    description: "",
    content: "",
    image: "",
    location: "",
    client: "",
    year: new Date().getFullYear().toString(),
    status: "draft",
    featured: false,
  });

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setError("");
    if (!form.title.trim()) {
      setError("A project title is required.");
      return;
    }
    const slug = form.slug.trim() || form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setSaving(true);
    const result = await adminFetch("projects", {
      method: "POST",
      body: JSON.stringify({
        title: form.title.trim(),
        slug,
        category: form.category,
        description: form.description.trim() || form.content.trim() || "Project details coming soon.",
        featured_image: form.image || null,
        client_name: form.client.trim() || null,
        date_completed: `${form.year || new Date().getFullYear()}-01-01`,
        featured: form.featured,
        published: form.status === "published",
        gallery: [],
      }),
    });
    setSaving(false);
    if (result.success) router.push("/admin/projects");
    else setError(result.error || "Unable to save project. Please try again.");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/projects" className="text-sm text-gray-400 hover:text-[#c5a059] flex items-center gap-1 mb-2">
            <FiArrowLeft size={14} /> Back to projects
          </Link>
          <h1 className="text-2xl font-extrabold text-white">New Project</h1>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"
        >
          <FiSave size={16} /> {saving ? "Saving..." : "Publish Project"}
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Modern Kitchen Renovation"
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
                placeholder="modern-kitchen-renovation"
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Short Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="A brief summary of the project..."
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none resize-none"
              />
            </div>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              label="Project Details"
              placeholder="Describe the project, design choices, materials used..."
            />
          </div>

          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Gallery Images</h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-[#1a3a5c]/30 border-2 border-dashed border-[#c5a059]/20 rounded-xl flex items-center justify-center text-gray-500 text-xs hover:border-[#c5a059]/50 cursor-pointer transition-colors">
                  + Add Image
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Cover Image</h3>
            <CloudinaryUpload
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
              folder="banglasketch/projects"
              label=""
            />
          </div>

          <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Project Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
              >
                <option value="kitchen">Kitchen</option>
                <option value="bedroom">Bedroom</option>
                <option value="living-room">Living Room</option>
                <option value="bathroom">Bathroom</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Gulshan, Dhaka"
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Client name"
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"
              />
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
              <span className="text-sm text-gray-300">Mark as featured project</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
