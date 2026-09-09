"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiPlus, FiEdit2, FiTrash2, FiImage as FiImageIcon, FiSearch, FiRefreshCw } from "react-icons/fi";
import { adminFetch, Project } from "../../../lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError("");
    const result = await adminFetch<Project[]>("projects");
    if (result.success && Array.isArray(result.data)) setProjects(result.data);
    else setError(result.error || "Unable to load projects.");
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, []);

  const filtered = useMemo(() => projects.filter((project) =>
    project.title.toLowerCase().includes(search.toLowerCase()) ||
    project.category.toLowerCase().includes(search.toLowerCase())
  ), [projects, search]);

  const deleteProject = async (project: Project) => {
    if (!window.confirm(`Permanently delete “${project.title}”? This cannot be undone.`)) return;
    setDeletingId(project.id);
    const result = await adminFetch(`projects/${project.id}`, { method: "DELETE" });
    if (result.success) setProjects((items) => items.filter((item) => String(item.id) !== String(project.id)));
    else setError(result.error || "Unable to delete the project.");
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Portfolio Projects</h1>
          <p className="text-sm text-[#5A625A] mt-1">Manage architectural portfolio showcase projects visible on the public website.</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <FiPlus size={15} /> New Project
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737D73]" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title, category, or style..."
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl pl-11 pr-4 py-3 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-xs"
          />
        </div>
        <button
          onClick={loadProjects}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348] text-xs font-semibold text-[#242824] transition-colors shadow-xs disabled:opacity-50"
          disabled={loading}
        >
          <FiRefreshCw className={loading ? "animate-spin text-[#586348]" : "text-[#586348]"} size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-3xl bg-[#EDE7DE] border border-[#DED5C7]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] border border-[#DED5C7] flex items-center justify-center mx-auto text-[#586348] mb-3">
            <FiImageIcon size={22} />
          </div>
          <h2 className="font-serif text-base font-bold text-[#242824] mb-1">No projects found</h2>
          <p className="text-xs text-[#5A625A]">
            {search ? "No projects match your current search query." : "Create your first portfolio project to make it visible on the website."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((project) => {
            const image = project.featured_image || project.coverImage;
            return (
              <article
                key={project.id}
                className="overflow-hidden rounded-3xl border border-[#DED5C7] bg-[#FCFAF7] shadow-xs hover:border-[#586348]/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/9] bg-[#EDE7DE] overflow-hidden">
                    {image ? (
                      <Image
                        src={image}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#8C948C]">
                        <FiImageIcon size={32} />
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border backdrop-blur-xs ${
                        project.published
                          ? "bg-emerald-50/90 text-emerald-800 border-emerald-200"
                          : "bg-amber-50/90 text-amber-800 border-amber-200"
                      }`}
                    >
                      {project.published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#586348] uppercase tracking-wider mb-1">
                          {project.category.replace("-", " ")}
                        </p>
                        <h2 className="font-serif text-base font-bold text-[#242824] truncate group-hover:text-[#586348] transition-colors">
                          {project.title}
                        </h2>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          aria-label={`Edit ${project.title}`}
                          className="rounded-xl p-2 border border-[#DED5C7] bg-white text-[#586348] hover:bg-[#EDF1EA] transition-colors shadow-2xs"
                        >
                          <FiEdit2 size={14} />
                        </Link>
                        <button
                          onClick={() => deleteProject(project)}
                          disabled={deletingId === project.id}
                          aria-label={`Delete ${project.title}`}
                          className="rounded-xl p-2 border border-[#DED5C7] bg-white text-[#737D73] hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50 shadow-2xs"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {project.description && (
                      <p className="mt-2.5 line-clamp-2 text-xs text-[#5A625A] leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-[#DED5C7] bg-[#F5F2EB]/50 flex items-center justify-between text-[11px] text-[#737D73]">
                  <span>Slug: {project.slug || "—"}</span>
                  {project.featured && (
                    <span className="font-semibold text-[#586348] uppercase text-[10px]">★ Featured</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
