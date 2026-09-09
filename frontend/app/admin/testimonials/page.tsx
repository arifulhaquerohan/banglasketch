"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiStar, FiMessageSquare, FiRefreshCw } from "react-icons/fi";
import { adminFetch, Testimonial } from "../../../lib/api";

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const result = await adminFetch<Testimonial[]>("testimonials");
    if (result.success && Array.isArray(result.data)) {
      setTestimonials(result.data);
    } else {
      setError(result.error || "Unable to load testimonials.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return testimonials.filter((t) => {
      const name = t.client_name || t.name || "";
      const quote = t.quote || t.content || "";
      const term = search.toLowerCase();
      return name.toLowerCase().includes(term) || quote.toLowerCase().includes(term);
    });
  }, [testimonials, search]);

  const remove = async (t: Testimonial) => {
    const name = t.client_name || t.name || "this testimonial";
    if (!window.confirm(`Delete review from “${name}”?`)) return;
    const result = await adminFetch(`testimonials/${t.id}`, { method: "DELETE" });
    if (result.success) {
      setTestimonials((items) => items.filter((item) => String(item.id) !== String(t.id)));
    } else {
      setError(result.error || "Unable to delete testimonial.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Testimonials</h1>
          <p className="text-gray-400 text-sm">Manage client reviews shown on the public site.</p>
        </div>
        <Link href="/admin/testimonials/new" className="btn btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
          <FiPlus size={16} /> Add Testimonial
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search testimonials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a2540] border border-[#c5a059]/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#c5a059] focus:outline-none transition-colors"
          />
        </div>
        <button onClick={load} className="btn btn-secondary text-sm flex items-center gap-2" disabled={loading}>
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#0a2540]" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-2xl border border-[#c5a059]/20 bg-[#0a2540]">
            <FiMessageSquare className="mx-auto mb-3 text-[#c5a059]/50" size={40} />
            <p className="font-bold text-white">No testimonials found</p>
          </div>
        ) : (
          filtered.map((t) => {
            const name = t.client_name || t.name || "Client";
            const location = t.client_location || t.role || "";
            const quote = t.quote || t.content || "";
            const rating = t.rating || 5;
            return (
              <div
                key={t.id}
                className="bg-[#0a2540] border border-[#c5a059]/20 rounded-2xl p-6 hover:border-[#c5a059]/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {t.client_image || t.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.client_image || t.avatar}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#c5a059]/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#1a3a5c] border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] font-bold text-lg shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-white truncate">{name}</h3>
                        {location && <p className="text-xs text-gray-400">{location}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Link
                          href={`/admin/testimonials/${t.id}`}
                          aria-label={`Edit review from ${name}`}
                          className="p-1.5 rounded-lg hover:bg-[#c5a059]/10 text-gray-400 hover:text-[#c5a059] transition-colors"
                        >
                          <FiEdit2 size={14} />
                        </Link>
                        <button
                          onClick={() => remove(t)}
                          aria-label={`Delete review from ${name}`}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FiStar
                          key={i}
                          size={12}
                          className={i < rating ? "text-[#c5a059] fill-[#c5a059]" : "text-gray-600"}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-3">{quote}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      {t.featured && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
