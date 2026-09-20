"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiImage,
  FiFileText,
  FiVideo,
  FiStar,
  FiMail,
  FiUsers,
  FiPlus,
  FiArrowRight,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiSettings,
  FiCalendar,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import { adminFetch } from "../../lib/api";

interface StatsData {
  projects: number;
  blogPosts: number;
  unreadContacts: number;
  testimonials: number;
  detail?: {
    projects: { total: number; published: number; featured: number };
    blog: { total: number; published: number; scheduled: number; views: number };
    videos: { total: number; published: number };
    testimonials: { total: number; avg_rating: number };
    contacts: { total: number; unread: number; unresponded: number; last_7_days: number };
    subscribers: number;
    siteVisits?: { total: number; pending: number; today: number; upcoming: number };
  };
  recentContacts?: Array<{
    id: number;
    name: string;
    email: string;
    service_type: string | null;
    read: boolean;
    responded: boolean;
    submitted_at: string;
  }>;
  todaySiteVisits?: SiteVisitSummary[];
  upcomingSiteVisits?: SiteVisitSummary[];
}

interface SiteVisitSummary {
  id: number;
  name: string;
  phone: string;
  location: string;
  visit_date: string;
  time_slot: string;
  time_slot_label: string;
  status: string;
  status_label: string;
}

function whatsappConfirmUrl(visit: SiteVisitSummary) {
  const message = `Hello ${visit.name}, your Bangla Sketch site visit is scheduled for ${visit.visit_date} at ${visit.time_slot_label}. Please confirm your availability.`;
  return `https://wa.me/88${visit.phone.replace(/\D/g, "").replace(/^88/, "")}?text=${encodeURIComponent(message)}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingUpcomingVisits = (stats?.upcomingSiteVisits || []).filter((visit) => visit.status === "pending");

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<StatsData>("stats");
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.error || "Unable to load dashboard statistics");
      }
    } catch {
      setError("Failed to fetch dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-admin-ink tracking-tight">Studio Dashboard</h1>
          <p className="text-sm text-admin-muted mt-1">
            Overview of architectural portfolio, client inquiries, and studio publications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-admin-surface border border-admin-border hover:border-admin-primary text-xs font-semibold text-admin-ink transition-colors shadow-xs"
          >
            <span>View Public Site</span>
            <FiExternalLink size={13} className="text-admin-primary" />
          </Link>
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-admin-ink text-admin-surface hover:bg-admin-elevated text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
          >
            <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadStats} className="underline text-xs hover:text-red-900 font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Projects Card */}
        <Link
          href="/admin/projects"
          className="group relative overflow-hidden rounded-2xl bg-admin-surface border border-admin-border p-6 hover:border-admin-primary transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-admin-primary">
              <FiImage size={20} />
            </div>
            <span className="text-xs font-semibold text-admin-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-admin-ink">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-admin-tint rounded animate-pulse" />
              ) : (
                stats?.detail?.projects?.total ?? stats?.projects ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-admin-muted uppercase tracking-wider mt-1">Portfolio Projects</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-admin-subtle">
              <span>{stats?.detail?.projects?.published ?? 0} Published</span>
              <span>•</span>
              <span>{stats?.detail?.projects?.featured ?? 0} Featured</span>
            </div>
          </div>
        </Link>

        {/* Blog Posts Card */}
        <Link
          href="/admin/blog"
          className="group relative overflow-hidden rounded-2xl bg-admin-surface border border-admin-border p-6 hover:border-admin-primary transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-admin-primary">
              <FiFileText size={20} />
            </div>
            <span className="text-xs font-semibold text-admin-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-admin-ink">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-admin-tint rounded animate-pulse" />
              ) : (
                stats?.detail?.blog?.total ?? stats?.blogPosts ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-admin-muted uppercase tracking-wider mt-1">Design Articles</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-admin-subtle">
              <span>{stats?.detail?.blog?.published ?? 0} Published</span>
              <span>•</span>
              <span>{stats?.detail?.blog?.views ?? 0} Reads</span>
            </div>
          </div>
        </Link>

        {/* Contacts / Leads Card */}
        <Link
          href="/admin/contacts"
          className="group relative overflow-hidden rounded-2xl bg-admin-surface border border-admin-border p-6 hover:border-admin-primary transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-admin-primary">
              <FiMail size={20} />
            </div>
            <span className="text-xs font-semibold text-admin-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-admin-ink">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-admin-tint rounded animate-pulse" />
                ) : (
                  stats?.detail?.contacts?.total ?? 0
                )}
              </span>
              {(stats?.detail?.contacts?.unread ?? stats?.unreadContacts ?? 0) > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B86B52]/15 text-[#B86B52] border border-[#B86B52]/30">
                  {stats?.detail?.contacts?.unread ?? stats?.unreadContacts} unread
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-admin-muted uppercase tracking-wider mt-1">Client Inquiries</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-admin-subtle">
              <span>{stats?.detail?.contacts?.last_7_days ?? 0} in past 7 days</span>
              <span>•</span>
              <span>{stats?.detail?.contacts?.unresponded ?? 0} pending reply</span>
            </div>
          </div>
        </Link>

        {/* Site Visits Card */}
        <Link
          href="/admin/site-visits"
          className="group relative overflow-hidden rounded-2xl bg-admin-surface border border-admin-border p-6 hover:border-admin-primary transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-admin-primary">
              <FiCalendar size={20} />
            </div>
            <span className="text-xs font-semibold text-admin-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Schedule <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-admin-ink">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-admin-tint rounded animate-pulse" />
                ) : (
                  stats?.detail?.siteVisits?.today ?? 0
                )}
              </span>
              {(stats?.detail?.siteVisits?.pending ?? 0) > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {stats?.detail?.siteVisits?.pending} pending
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-admin-muted uppercase tracking-wider mt-1">Today&apos;s Site Visits</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-admin-subtle">
              <span>{stats?.detail?.siteVisits?.upcoming ?? 0} upcoming</span>
              <span>•</span>
              <span>{stats?.detail?.siteVisits?.total ?? 0} total</span>
            </div>
          </div>
        </Link>

        {/* Testimonials Card */}
        <Link
          href="/admin/testimonials"
          className="group relative overflow-hidden rounded-2xl bg-admin-surface border border-admin-border p-6 hover:border-admin-primary transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-admin-primary">
              <FiStar size={20} />
            </div>
            <span className="text-xs font-semibold text-admin-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-admin-ink">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-admin-tint rounded animate-pulse" />
              ) : (
                stats?.detail?.testimonials?.total ?? stats?.testimonials ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-admin-muted uppercase tracking-wider mt-1">Client Endorsements</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-admin-subtle">
              <span>Avg Rating: {stats?.detail?.testimonials?.avg_rating ?? 5.0} ★</span>
            </div>
          </div>
        </Link>

        {/* Videos Card */}
        <Link
          href="/admin/videos"
          className="group relative overflow-hidden rounded-2xl bg-admin-surface border border-admin-border p-6 hover:border-admin-primary transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-admin-primary">
              <FiVideo size={20} />
            </div>
            <span className="text-xs font-semibold text-admin-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-admin-ink">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-admin-tint rounded animate-pulse" />
              ) : (
                stats?.detail?.videos?.total ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-admin-muted uppercase tracking-wider mt-1">Video Walkthroughs</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-admin-subtle">
              <span>{stats?.detail?.videos?.published ?? 0} Published</span>
            </div>
          </div>
        </Link>

        {/* Subscribers Card */}
        <Link
          href="/admin/settings"
          className="group relative overflow-hidden rounded-2xl bg-admin-surface border border-admin-border p-6 hover:border-admin-primary transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-admin-primary">
              <FiUsers size={20} />
            </div>
            <span className="text-xs font-semibold text-admin-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Settings <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-admin-ink">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-admin-tint rounded animate-pulse" />
              ) : (
                stats?.detail?.subscribers ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-admin-muted uppercase tracking-wider mt-1">Newsletter Subscribers</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-admin-subtle">
              <span>Active client subscriptions</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Daily Work Queue */}
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl bg-admin-surface border border-admin-border p-6 shadow-xs">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-admin-ink">Today&apos;s Site Visits</h2>
              <p className="text-xs text-admin-subtle mt-0.5">Call, confirm, and prepare the route for today.</p>
            </div>
            <Link href="/admin/site-visits" className="text-xs font-semibold text-admin-primary hover:underline flex items-center gap-1">
              Open calendar <FiArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-admin-tint animate-pulse" />
              ))}
            </div>
          ) : !stats?.todaySiteVisits?.length ? (
            <div className="rounded-2xl border border-admin-border bg-admin-canvas p-8 text-center text-sm text-admin-subtle">
              <FiCalendar className="mx-auto mb-2 text-admin-primary" size={24} />
              No site visits scheduled today.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.todaySiteVisits.map((visit) => (
                <div key={visit.id} className="rounded-2xl border border-admin-border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-admin-ink">{visit.name}</p>
                        <span className="rounded-full border border-[#D5DEC4] bg-[#EDF1EA] px-2 py-0.5 text-[10px] font-semibold text-admin-hover">
                          {visit.status_label}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-admin-primary">
                        <FiClock size={13} /> {visit.time_slot_label}
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-admin-muted">
                        <FiMapPin className="mt-0.5 shrink-0" size={13} /> {visit.location}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${visit.phone}`} className="inline-flex items-center gap-1.5 rounded-xl bg-admin-ink px-3 py-2 text-xs font-semibold text-white">
                        <FiPhone size={13} /> Call
                      </a>
                      <a href={whatsappConfirmUrl(visit)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5DEC4] bg-[#EDF1EA] px-3 py-2 text-xs font-semibold text-[#1F5128]">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-admin-surface border border-admin-border p-6 shadow-xs">
          <div className="mb-5">
            <h2 className="font-serif text-lg font-bold text-admin-ink">Pending Confirmations</h2>
            <p className="text-xs text-admin-subtle mt-0.5">Upcoming bookings that still need admin attention.</p>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-admin-tint animate-pulse" />
              ))}
            </div>
          ) : !pendingUpcomingVisits.length ? (
            <p className="rounded-2xl border border-admin-border bg-admin-canvas p-6 text-center text-sm text-admin-subtle">
              No upcoming pending visits.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingUpcomingVisits
                .slice(0, 5)
                .map((visit) => (
                  <div key={visit.id} className="rounded-2xl border border-admin-border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-admin-ink">{visit.name}</p>
                        <p className="mt-1 text-xs text-admin-muted">
                          {new Date(visit.visit_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at {visit.time_slot_label}
                        </p>
                      </div>
                      <a href={`tel:${visit.phone}`} className="shrink-0 rounded-xl border border-admin-border p-2 text-admin-primary hover:bg-[#EDF1EA]" aria-label={`Call ${visit.name}`}>
                        <FiPhone size={14} />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Actions Row */}
      <div className="rounded-2xl bg-admin-surface border border-admin-border p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-admin-primary mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-admin-ink hover:bg-admin-elevated text-admin-surface font-semibold text-xs transition-colors shadow-xs"
          >
            <FiPlus size={15} />
            <span>Add New Project</span>
          </Link>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-admin-surface hover:bg-admin-tint text-admin-ink font-semibold text-xs border border-admin-border transition-colors"
          >
            <FiPlus size={15} className="text-admin-primary" />
            <span>Write New Article</span>
          </Link>
          <Link
            href="/admin/testimonials/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-admin-surface hover:bg-admin-tint text-admin-ink font-semibold text-xs border border-admin-border transition-colors"
          >
            <FiPlus size={15} className="text-admin-primary" />
            <span>Add Testimonial</span>
          </Link>
          <Link
            href="/admin/videos/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-admin-surface hover:bg-admin-tint text-admin-ink font-semibold text-xs border border-admin-border transition-colors"
          >
            <FiPlus size={15} className="text-admin-primary" />
            <span>Add Video Showcase</span>
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-admin-surface hover:bg-admin-tint text-admin-muted font-semibold text-xs border border-admin-border transition-colors ml-auto"
          >
            <FiSettings size={15} className="text-admin-primary" />
            <span>Studio Settings</span>
          </Link>
        </div>
      </div>

      {/* Recent Inquiries Table */}
      <div className="rounded-2xl bg-admin-surface border border-admin-border p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-admin-ink">Recent Client Inquiries</h2>
            <p className="text-xs text-admin-subtle mt-0.5">Direct messages submitted through the website</p>
          </div>
          <Link
            href="/admin/contacts"
            className="text-xs font-semibold text-admin-primary hover:underline flex items-center gap-1"
          >
            View all inquiries <FiArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-admin-tint animate-pulse" />
            ))}
          </div>
        ) : !stats?.recentContacts || stats.recentContacts.length === 0 ? (
          <div className="text-center py-10 text-admin-subtle text-sm">
            <FiMail className="mx-auto text-admin-subtle mb-2" size={24} />
            No inquiries received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-admin-subtle">
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/60">
                {stats.recentContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-admin-tint/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-admin-ink">{c.name}</div>
                      <div className="text-xs text-admin-subtle">{c.email}</div>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-admin-muted">
                      {c.service_type || "General Consultation"}
                    </td>
                    <td className="py-3.5 pr-4 text-xs">
                      {c.responded ? (
                        <span className="inline-flex items-center gap-1 text-admin-hover font-medium bg-[#EDF1EA] px-2 py-0.5 rounded-full border border-[#D5DEC4]">
                          <FiCheckCircle size={12} className="text-admin-primary" /> Responded
                        </span>
                      ) : !c.read ? (
                        <span className="inline-flex items-center gap-1 text-[#B86B52] font-semibold bg-[#B86B52]/10 px-2 py-0.5 rounded-full border border-[#B86B52]/20">
                          <FiClock size={12} /> Unread
                        </span>
                      ) : (
                        <span className="text-admin-subtle">Read</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-admin-subtle">
                      {new Date(c.submitted_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href="/admin/contacts"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-admin-surface border border-admin-border hover:border-admin-primary text-xs text-admin-primary font-semibold transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
