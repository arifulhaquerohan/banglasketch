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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-admin-ink tracking-tight">Client Testimonials</h1>
          <p className="text-sm text-admin-muted mt-1">Manage verified reviews, endorsements, and client experiences.</p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-admin-primary hover:bg-admin-hover text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <FiPlus size={15} /> Add Testimonial
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-subtle" size={16} />
          <input
            type="text"
            placeholder="Search reviews by client or quotation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-admin-surface border border-admin-border rounded-2xl pl-11 pr-4 py-3 text-xs text-admin-ink placeholder:text-admin-subtle focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/20 transition-all shadow-xs"
          />
        </div>
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

      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-admin-tint border border-admin-border" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-3xl border border-admin-border bg-admin-surface shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-admin-canvas border border-admin-border flex items-center justify-center mx-auto text-admin-primary mb-3">
              <FiMessageSquare size={22} />
            </div>
            <p className="font-serif text-base font-bold text-admin-ink">No testimonials found</p>
            <p className="text-xs text-admin-muted mt-1">
              {search ? "No client reviews match your search query." : "Add client feedback to showcase studio trust and client satisfaction."}
            </p>
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
                className="bg-admin-surface border border-admin-border rounded-3xl p-6 hover:border-admin-primary/50 transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start gap-4">
                    {t.client_image || t.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.client_image || t.avatar}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-admin-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#EDF1EA] border border-admin-border flex items-center justify-center text-admin-primary font-bold text-base shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h3 className="font-serif text-base font-bold text-admin-ink break-words group-hover:text-admin-primary transition-colors">{name}</h3>
                          {location && <p className="text-xs text-admin-muted">{location}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/testimonials/${t.id}`}
                            aria-label={`Edit review from ${name}`}
                            className="p-2 rounded-xl border border-admin-border bg-white text-admin-primary hover:bg-[#EDF1EA] transition-colors shadow-2xs"
                          >
                            <FiEdit2 size={13} />
                          </Link>
                          <button
                            onClick={() => remove(t)}
                            aria-label={`Delete review from ${name}`}
                            className="p-2 rounded-xl border border-admin-border bg-white text-admin-subtle hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors shadow-2xs"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1 mb-2.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FiStar
                            key={i}
                            size={13}
                            className={i < rating ? "text-amber-500 fill-amber-500" : "text-admin-border"}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-admin-muted line-clamp-3 leading-relaxed italic">“{quote}”</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-admin-tint flex items-center justify-between text-xs text-admin-subtle">
                  {t.featured ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EDF1EA] text-admin-hover border border-admin-primary/20">
                      ★ Featured on Home
                    </span>
                  ) : (
                    <span className="text-[11px] text-admin-subtle">Standard Review</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
