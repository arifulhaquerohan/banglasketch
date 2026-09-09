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

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><FiRefreshCw className="animate-spin text-[#c5a059]" size={28}/></div>;
  if (error && !form.title) return <div className="space-y-4"><p role="alert" className="text-red-300">{error}</p><Link href="/admin/projects" className="btn btn-secondary">Back to Projects</Link></div>;

  return <div className="space-y-6 max-w-5xl">
    <div className="flex items-center justify-between gap-4"><div><Link href="/admin/projects" className="text-sm text-gray-400 hover:text-[#c5a059] flex items-center gap-1 mb-2"><FiArrowLeft size={14}/> Back to projects</Link><h1 className="text-2xl font-extrabold text-white">Edit Project</h1></div><div className="flex gap-2"><button type="button" onClick={() => setHistoryOpen(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-[#c5a059]/30 text-[#c5a059] hover:bg-[#c5a059]/10"><FiClock size={16}/> History</button><button type="button" onClick={handleDelete} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50"><FiTrash2 size={16}/> Delete</button><button type="button" onClick={() => handleSubmit()} disabled={saving} className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"><FiSave size={16}/> {saving ? "Saving..." : "Save Changes"}</button></div></div>
    {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
    <VersionHistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} entity="projects" entityId={params.id} onRestored={loadProject} />
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">URL Slug</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none font-mono"/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">Short Description</label><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none resize-none"/></div></div></div><div className="space-y-6"><div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4"><h2 className="text-lg font-bold text-white">Cover Image</h2><CloudinaryUpload value={form.image} onChange={(image) => setForm({ ...form, image })} folder="banglasketch/projects" label=""/></div><div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 space-y-4"><h2 className="text-lg font-bold text-white">Details</h2><div><label className="block text-sm font-medium text-gray-300 mb-2">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"><option value="kitchen">Kitchen</option><option value="bedroom">Bedroom</option><option value="living-room">Living Room</option><option value="bathroom">Bathroom</option></select></div><div><label className="block text-sm font-medium text-gray-300 mb-2">Client</label><input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">Completion Date</label><input type="date" value={form.dateCompleted} onChange={(e) => setForm({ ...form, dateCompleted: e.target.value })} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })} className="w-full bg-[#1a3a5c] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"><option value="draft">Draft</option><option value="published">Published</option></select></div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-[#c5a059]"/><span className="text-sm text-gray-300">Featured project</span></label></div></div></form>
  </div>;
}
