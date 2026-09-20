"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFileText, FiRefreshCw } from "react-icons/fi";
import { adminFetch, BlogPost } from "../../../lib/api";

function postStatus(post: BlogPost) {
  if (!post.published) return "Draft";
  if (post.scheduled_publish_date && new Date(post.scheduled_publish_date) > new Date()) return "Scheduled";
  return "Published";
}

const STATUS_COLORS: Record<string, string> = {
  Published: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Draft: "bg-amber-50 text-amber-800 border-amber-200",
  Scheduled: "bg-[#EDF1EA] text-admin-primary border-[#D5DEC4]",
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => { setLoading(true); setError(""); const result = await adminFetch<BlogPost[]>("blog"); if (result.success && Array.isArray(result.data)) setPosts(result.data); else setError(result.error || "Unable to load posts."); setLoading(false); };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => posts.filter((post) => { const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()); const matchesStatus = status === "all" || postStatus(post).toLowerCase() === status; return matchesSearch && matchesStatus; }), [posts, search, status]);
  const remove = async (post: BlogPost) => { if (!window.confirm(`Delete “${post.title}”?`)) return; const result = await adminFetch(`blog/${post.id}`, { method: "DELETE" }); if (result.success) setPosts((current) => current.filter((item) => String(item.id) !== String(post.id))); else setError(result.error || "Unable to delete post."); };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-admin-ink tracking-tight">Blog Journal</h1>
          <p className="text-admin-muted text-sm mt-1">Write, schedule, and curate architectural essays and design insights.</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-admin-primary hover:bg-admin-hover text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <FiPlus size={15} /> Write Post
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-subtle" size={16} />
          <input
            placeholder="Search articles by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-admin-surface border border-admin-border rounded-2xl pl-11 pr-4 py-3 text-xs text-admin-ink placeholder:text-admin-subtle focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/20 transition-all shadow-xs"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-admin-surface border border-admin-border rounded-2xl px-4 py-3 text-xs text-admin-ink font-medium focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/20 transition-all shadow-xs"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-admin-surface border border-admin-border hover:border-admin-primary text-xs font-semibold text-admin-ink transition-colors shadow-xs disabled:opacity-50"
          disabled={loading}
        >
          <FiRefreshCw className={loading ? "animate-spin text-admin-primary" : "text-admin-primary"} size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      <div className="bg-admin-surface border border-admin-border rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-canvas text-left text-xs font-semibold text-admin-primary uppercase tracking-wider">
                <th className="px-6 py-4">Post Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-admin-subtle py-12">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <FiRefreshCw className="animate-spin text-admin-primary" size={16} />
                      <span>Loading journal articles…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-admin-subtle py-12">
                    <div className="w-12 h-12 rounded-2xl bg-admin-canvas border border-admin-border flex items-center justify-center mx-auto text-admin-primary mb-3">
                      <FiFileText size={22} />
                    </div>
                    <p className="font-semibold text-admin-ink">No journal posts found</p>
                    <p className="text-xs text-admin-muted mt-1">Try changing your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((post) => {
                  const currentStatus = postStatus(post);
                  return (
                    <tr key={post.id} className="hover:bg-admin-canvas/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#EDF1EA] flex items-center justify-center text-admin-primary shrink-0 border border-[#D5DEC4]">
                            <FiFileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-admin-ink block truncate max-w-sm">{post.title}</span>
                            <span className="text-[11px] text-admin-muted font-mono block truncate max-w-xs">{post.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-admin-ink">{post.category}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[currentStatus]}`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-admin-subtle tabular-nums">{post.views_count?.toLocaleString() || "0"}</td>
                      <td className="px-6 py-4 text-xs text-admin-subtle tabular-nums">
                        {post.published_date ? new Date(post.published_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/blog/${post.id}`}
                            aria-label={`Edit ${post.title}`}
                            className="p-2 rounded-xl border border-admin-border bg-white text-admin-primary hover:bg-[#EDF1EA] transition-colors shadow-2xs"
                          >
                            <FiEdit2 size={14} />
                          </Link>
                          <button
                            onClick={() => remove(post)}
                            aria-label={`Delete ${post.title}`}
                            className="p-2 rounded-xl border border-admin-border bg-white text-admin-subtle hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors shadow-2xs"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
