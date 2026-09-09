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

const STATUS_COLORS: Record<string, string> = { Published: "bg-green-500/20 text-green-400 border-green-500/30", Draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", Scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30" };

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

  return <div className="space-y-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-white">Blog Posts</h1><p className="text-gray-400 text-sm">Write and manage content published to your journal.</p></div><Link href="/admin/blog/new" className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5"><FiPlus size={16}/> Write Post</Link></div><div className="flex flex-wrap gap-3"><div className="relative flex-1 min-w-[200px]"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#0a2540] border border-[#c5a059]/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none"/></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#0a2540] border border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none"><option value="all">All Status</option><option value="published">Published</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option></select><button onClick={load} className="btn btn-secondary flex items-center gap-2 text-sm" disabled={loading}><FiRefreshCw className={loading ? "animate-spin" : ""}/>Refresh</button></div>{error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}      <div className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#c5a059]/20 bg-[#071d33]">
                <th className="text-left text-xs font-semibold text-[#c5a059] uppercase tracking-wider px-6 py-4">Post</th>
                <th className="text-left text-xs font-semibold text-[#c5a059] uppercase tracking-wider px-6 py-4">Category</th>
                <th className="text-left text-xs font-semibold text-[#c5a059] uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-[#c5a059] uppercase tracking-wider px-6 py-4">Views</th>
                <th className="text-left text-xs font-semibold text-[#c5a059] uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-right text-xs font-semibold text-[#c5a059] uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12">
                    <div className="flex items-center justify-center gap-2">
                      <FiRefreshCw className="animate-spin text-[#c5a059]" size={18} />
                      <span>Loading posts…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12">No posts found</td>
                </tr>
              ) : (
                filtered.map((post) => {
                  const currentStatus = postStatus(post);
                  return (
                    <tr key={post.id} className="border-b border-[#c5a059]/10 hover:bg-[#c5a059]/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] shrink-0 border border-[#c5a059]/20">
                            <FiFileText size={18} />
                          </div>
                          <span className="font-semibold text-white max-w-xs truncate">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{post.category}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[currentStatus]}`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{post.views_count?.toLocaleString() || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {post.published_date ? new Date(post.published_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/blog/${post.id}`}
                            aria-label={`Edit ${post.title}`}
                            className="p-2.5 rounded-xl hover:bg-[#c5a059]/10 text-gray-400 hover:text-[#c5a059] transition-colors"
                          >
                            <FiEdit2 size={16} />
                          </Link>
                          <button
                            onClick={() => remove(post)}
                            aria-label={`Delete ${post.title}`}
                            className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <FiTrash2 size={16} />
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
      </div></div>;
}
