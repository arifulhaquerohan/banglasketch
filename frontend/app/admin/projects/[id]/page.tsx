"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiSave, FiArrowLeft, FiTrash2, FiRefreshCw, FiClock } from "react-icons/fi";
import { CloudinaryUpload } from "../../../../components/admin/CloudinaryUpload";
import { adminFetch, Project } from "../../../../lib/api";
import VersionHistoryModal from "../../../../components/admin/VersionHistoryModal";

interface ProjectFormState {
  title: string; slug: string; category: string; description: string; image: string;
  client: string; dateCompleted: string; status: "draft" | "published"; featured: boolean;
}

const emptyForm: ProjectFormState = { title: "", slug: "", category: "kitchen", description: "", image: "", client: "", dateCompleted: "", status: "draft", featured: false };

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadProject = useCallback(async () => {
    if (!params.id) return;
    setLoading(true); setError("");
    const result = await adminFetch<Project[]>("projects");
    const project = result.data?.find((item) => String(item.id) === String(params.id));
    if (!project) setError(result.error || "Project not found.");
    else setForm({
      title: project.title, slug: project.slug, category: project.category, description: project.description || "",
      image: project.featured_image || project.coverImage || "", client: project.client_name || "",
      dateCompleted: project.date_completed ? project.date_completed.slice(0, 10) : "",
      status: project.published ? "published" : "draft", featured: Boolean(project.featured),
    });
    setLoading(false);
  }, [params.id]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.(); setSaving(true); setError("");
    const result = await adminFetch(`projects/${params.id}`, { method: "PUT", body: JSON.stringify({
      title: form.title.trim(), slug: form.slug.trim(), category: form.category, description: form.description.trim(),
      featured_image: form.image || null, client_name: form.client || null, date_completed: form.dateCompleted || null,
      featured: form.featured, published: form.status === "published",
    }) });
    setSaving(false);
    if (result.success) router.push("/admin/projects"); else setError(result.error || "Unable to save changes.");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Move “${form.title}” to Recycle Bin? It can be restored later.`)) return;
    setSaving(true); const result = await adminFetch(`projects/${params.id}`, { method: "DELETE" }); setSaving(false);
    if (result.success) router.push("/admin/projects"); else setError(result.error || "Unable to delete project.");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FiRefreshCw className="animate-spin text-[#586348]" size={28} />
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <p role="alert" className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-2xl p-4">
          {error}
        </p>
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] text-xs font-semibold text-[#242824] hover:border-[#586348]"
        >
          <FiArrowLeft size={14} /> Back to Projects
        </Link>
      </div>
    );
  }

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
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Edit Project</h1>
          <p className="text-sm text-[#5A625A] mt-0.5">Update portfolio showcase details, metadata, and media.</p>
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
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 transition-colors disabled:opacity-50 shadow-xs"
          >
            <FiTrash2 size={14} /> Delete
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <FiSave size={15} /> {saving ? "Saving..." : "Save Changes"}
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
        entity="projects"
        entityId={params.id}
        onRestored={loadProject}
      />

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Project Narrative</h2>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Project Title
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
                URL Slug
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
                Short Description
              </label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all resize-none shadow-2xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Cover Showcase</h2>
            <CloudinaryUpload
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
              folder="banglasketch/projects"
              label=""
            />
          </div>

          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#242824]">Project Metadata</h2>
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
                Client
              </label>
              <input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-1.5">
                Completion Date
              </label>
              <input
                type="date"
                value={form.dateCompleted}
                onChange={(e) => setForm({ ...form, dateCompleted: e.target.value })}
                className="w-full bg-white border border-[#DED5C7] rounded-xl px-4 py-2.5 text-xs text-[#242824] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 shadow-2xs"
              />
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
              <span className="text-xs font-medium text-[#242824]">Featured project</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
