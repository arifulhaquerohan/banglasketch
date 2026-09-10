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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/projects"
            className="text-xs font-semibold text-[#5A625A] hover:text-[#586348] inline-flex items-center gap-1.5 mb-2 transition-colors"
          >
            <FiArrowLeft size={14} /> Back to projects
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">New Project</h1>
          <p className="text-sm text-[#5A625A] mt-0.5">Draft and publish a new architectural project to your portfolio.</p>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <FiSave size={15} /> {saving ? "Publishing..." : "Publish Project"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Project Narrative</h2>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Project Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Modern Minimalist Kitchen Renovation"
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
                placeholder="modern-minimalist-kitchen"
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all font-mono shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Short Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="A brief overview of the space, layout, and client brief..."
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all resize-none shadow-2xs leading-relaxed"
              />
            </div>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              label="Detailed Project Story"
              placeholder="Describe the architectural design choices, materials used, lighting, textures..."
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Gallery Media</h3>
            <p className="text-xs text-[#5A625A]">Additional perspectives, render angles, and layout sketches.</p>
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-white border-2 border-dashed border-[#DED5C7] rounded-2xl flex items-center justify-center text-[#737D73] text-xs hover:border-[#586348] hover:bg-[#F5F2EB]/50 cursor-pointer transition-colors shadow-2xs"
                >
                  + Add Media
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Cover Showcase</h3>
            <CloudinaryUpload
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
              folder="banglasketch/projects"
              label=""
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Project Metadata</h3>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              >
                <option value="kitchen">Kitchen</option>
                <option value="bedroom">Bedroom</option>
                <option value="living-room">Living Room</option>
                <option value="bathroom">Bathroom</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Gulshan-2, Dhaka"
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Client / Studio Partner
              </label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="e.g. Private Residence"
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Completion Year
              </label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              />
            </div>
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#242824]">Visibility & Publication</h3>
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
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-[#586348] rounded"
              />
              <span className="text-xs font-medium text-[#242824]">Feature this project on homepage</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
