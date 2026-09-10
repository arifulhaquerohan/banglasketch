"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiVideo, FiPlay, FiRefreshCw } from "react-icons/fi";
import { adminFetch, Video } from "../../../lib/api";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); const result = await adminFetch<Video[]>("videos"); if (result.success && Array.isArray(result.data)) setVideos(result.data); else setError(result.error || "Unable to load videos."); setLoading(false); };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => videos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase())), [videos, search]);
  const remove = async (video: Video) => { if (!window.confirm(`Delete “${video.title}”?`)) return; const result = await adminFetch(`videos/${video.id}`, { method: "DELETE" }); if (result.success) setVideos((items) => items.filter((item) => String(item.id) !== String(video.id))); else setError(result.error || "Unable to delete video."); };
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Videos & Site Vlogs</h1>
          <p className="text-sm text-[#5A625A] mt-1">Manage architectural video walkthroughs, project timelapses, and media reels.</p>
        </div>
        <Link
          href="/admin/videos/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <FiPlus size={15} /> Add Video
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737D73]" size={16} />
          <input
            placeholder="Search videos by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl pl-11 pr-4 py-3 text-xs text-[#242824] placeholder:text-[#8C948C] focus:border-[#586348] focus:outline-none focus:ring-2 focus:ring-[#586348]/20 transition-all shadow-xs"
          />
        </div>
        <button
          onClick={load}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-3xl bg-[#EDE7DE] border border-[#DED5C7]" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-3xl border border-[#DED5C7] bg-[#FCFAF7] shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] border border-[#DED5C7] flex items-center justify-center mx-auto text-[#586348] mb-3">
              <FiVideo size={22} />
            </div>
            <p className="font-serif text-base font-bold text-[#242824]">No videos found</p>
            <p className="text-xs text-[#5A625A] mt-1">
              {search ? "No video titles match your search criteria." : "Add your first video to display on your portfolio."}
            </p>
          </div>
        ) : (
          filtered.map((video) => {
            const thumbnail = video.thumbnail || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80";
            return (
              <article
                key={video.id}
                className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl overflow-hidden hover:border-[#586348]/50 transition-all shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-[#EDE7DE] overflow-hidden">
                    <Image
                      src={thumbnail}
                      alt={video.title}
                      fill
                      sizes="400px"
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-[#242824]/20 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#586348] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <FiPlay className="ml-0.5 text-white" size={18} />
                      </div>
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2.5 right-2.5 bg-[#242824]/85 text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg backdrop-blur-xs">
                        {video.duration}
                      </div>
                    )}
                    <span
                      className={`absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border backdrop-blur-xs ${
                        video.published
                          ? "bg-emerald-50/90 text-emerald-800 border-emerald-200"
                          : "bg-amber-50/90 text-amber-800 border-amber-200"
                      }`}
                    >
                      {video.published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="p-5">
                    <h2 className="font-serif text-base font-bold text-[#242824] mb-1.5 line-clamp-2 group-hover:text-[#586348] transition-colors">
                      {video.title}
                    </h2>
                    <p className="text-xs text-[#5A625A] line-clamp-2 leading-relaxed">
                      {video.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-[#DED5C7] bg-[#F5F2EB]/50 flex items-center justify-between">
                  <span className="text-[11px] text-[#737D73]">
                    {video.featured ? <span className="font-semibold text-[#586348] uppercase text-[10px]">★ Featured</span> : "Standard Reel"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/videos/${video.id}`}
                      aria-label={`Edit ${video.title}`}
                      className="p-2 rounded-xl border border-[#DED5C7] bg-white text-[#586348] hover:bg-[#EDF1EA] transition-colors shadow-2xs"
                    >
                      <FiEdit2 size={14} />
                    </Link>
                    <button
                      onClick={() => remove(video)}
                      aria-label={`Delete ${video.title}`}
                      className="p-2 rounded-xl border border-[#DED5C7] bg-white text-[#737D73] hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors shadow-2xs"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
