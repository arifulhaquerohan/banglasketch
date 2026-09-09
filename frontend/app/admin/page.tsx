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
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight">Studio Dashboard</h1>
          <p className="text-sm text-[#5A625A] mt-1">
            Overview of architectural portfolio, client inquiries, and studio publications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348] text-xs font-semibold text-[#242824] transition-colors shadow-xs"
          >
            <span>View Public Site</span>
            <FiExternalLink size={13} className="text-[#586348]" />
          </Link>
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#242824] text-[#FCFAF7] hover:bg-[#383E38] text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
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
          className="group relative overflow-hidden rounded-2xl bg-[#FCFAF7] border border-[#DED5C7] p-6 hover:border-[#586348] transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
              <FiImage size={20} />
            </div>
            <span className="text-xs font-semibold text-[#586348] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-[#242824]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EDE7DE] rounded animate-pulse" />
              ) : (
                stats?.detail?.projects?.total ?? stats?.projects ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-[#5A625A] uppercase tracking-wider mt-1">Portfolio Projects</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#737D73]">
              <span>{stats?.detail?.projects?.published ?? 0} Published</span>
              <span>•</span>
              <span>{stats?.detail?.projects?.featured ?? 0} Featured</span>
            </div>
          </div>
        </Link>

        {/* Blog Posts Card */}
        <Link
          href="/admin/blog"
          className="group relative overflow-hidden rounded-2xl bg-[#FCFAF7] border border-[#DED5C7] p-6 hover:border-[#586348] transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
              <FiFileText size={20} />
            </div>
            <span className="text-xs font-semibold text-[#586348] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-[#242824]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EDE7DE] rounded animate-pulse" />
              ) : (
                stats?.detail?.blog?.total ?? stats?.blogPosts ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-[#5A625A] uppercase tracking-wider mt-1">Design Articles</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#737D73]">
              <span>{stats?.detail?.blog?.published ?? 0} Published</span>
              <span>•</span>
              <span>{stats?.detail?.blog?.views ?? 0} Reads</span>
            </div>
          </div>
        </Link>

        {/* Contacts / Leads Card */}
        <Link
          href="/admin/contacts"
          className="group relative overflow-hidden rounded-2xl bg-[#FCFAF7] border border-[#DED5C7] p-6 hover:border-[#586348] transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
              <FiMail size={20} />
            </div>
            <span className="text-xs font-semibold text-[#586348] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-[#242824]">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-[#EDE7DE] rounded animate-pulse" />
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
            <div className="text-xs font-semibold text-[#5A625A] uppercase tracking-wider mt-1">Client Inquiries</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#737D73]">
              <span>{stats?.detail?.contacts?.last_7_days ?? 0} in past 7 days</span>
              <span>•</span>
              <span>{stats?.detail?.contacts?.unresponded ?? 0} pending reply</span>
            </div>
          </div>
        </Link>

        {/* Testimonials Card */}
        <Link
          href="/admin/testimonials"
          className="group relative overflow-hidden rounded-2xl bg-[#FCFAF7] border border-[#DED5C7] p-6 hover:border-[#586348] transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
              <FiStar size={20} />
            </div>
            <span className="text-xs font-semibold text-[#586348] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-[#242824]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EDE7DE] rounded animate-pulse" />
              ) : (
                stats?.detail?.testimonials?.total ?? stats?.testimonials ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-[#5A625A] uppercase tracking-wider mt-1">Client Endorsements</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#737D73]">
              <span>Avg Rating: {stats?.detail?.testimonials?.avg_rating ?? 5.0} ★</span>
            </div>
          </div>
        </Link>

        {/* Videos Card */}
        <Link
          href="/admin/videos"
          className="group relative overflow-hidden rounded-2xl bg-[#FCFAF7] border border-[#DED5C7] p-6 hover:border-[#586348] transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
              <FiVideo size={20} />
            </div>
            <span className="text-xs font-semibold text-[#586348] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-[#242824]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EDE7DE] rounded animate-pulse" />
              ) : (
                stats?.detail?.videos?.total ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-[#5A625A] uppercase tracking-wider mt-1">Video Walkthroughs</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#737D73]">
              <span>{stats?.detail?.videos?.published ?? 0} Published</span>
            </div>
          </div>
        </Link>

        {/* Subscribers Card */}
        <Link
          href="/admin/settings"
          className="group relative overflow-hidden rounded-2xl bg-[#FCFAF7] border border-[#DED5C7] p-6 hover:border-[#586348] transition-all shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
              <FiUsers size={20} />
            </div>
            <span className="text-xs font-semibold text-[#586348] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Settings <FiArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <div className="font-serif text-3xl font-bold text-[#242824]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EDE7DE] rounded animate-pulse" />
              ) : (
                stats?.detail?.subscribers ?? 0
              )}
            </div>
            <div className="text-xs font-semibold text-[#5A625A] uppercase tracking-wider mt-1">Newsletter Subscribers</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#737D73]">
              <span>Active client subscriptions</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions Row */}
      <div className="rounded-2xl bg-[#FCFAF7] border border-[#DED5C7] p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#586348] mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] font-semibold text-xs transition-colors shadow-xs"
          >
            <FiPlus size={15} />
            <span>Add New Project</span>
          </Link>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] hover:bg-[#EDE7DE] text-[#242824] font-semibold text-xs border border-[#DED5C7] transition-colors"
          >
            <FiPlus size={15} className="text-[#586348]" />
            <span>Write New Article</span>
          </Link>
          <Link
            href="/admin/testimonials/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] hover:bg-[#EDE7DE] text-[#242824] font-semibold text-xs border border-[#DED5C7] transition-colors"
          >
            <FiPlus size={15} className="text-[#586348]" />
            <span>Add Testimonial</span>
          </Link>
          <Link
            href="/admin/videos/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] hover:bg-[#EDE7DE] text-[#242824] font-semibold text-xs border border-[#DED5C7] transition-colors"
          >
            <FiPlus size={15} className="text-[#586348]" />
            <span>Add Video Showcase</span>
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] hover:bg-[#EDE7DE] text-[#5A625A] font-semibold text-xs border border-[#DED5C7] transition-colors ml-auto"
          >
            <FiSettings size={15} className="text-[#586348]" />
            <span>Studio Settings</span>
          </Link>
        </div>
      </div>

      {/* Recent Inquiries Table */}
      <div className="rounded-2xl bg-[#FCFAF7] border border-[#DED5C7] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#242824]">Recent Client Inquiries</h2>
            <p className="text-xs text-[#737D73] mt-0.5">Direct messages submitted through the website</p>
          </div>
          <Link
            href="/admin/contacts"
            className="text-xs font-semibold text-[#586348] hover:underline flex items-center gap-1"
          >
            View all inquiries <FiArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-[#EDE7DE] animate-pulse" />
            ))}
          </div>
        ) : !stats?.recentContacts || stats.recentContacts.length === 0 ? (
          <div className="text-center py-10 text-[#737D73] text-sm">
            <FiMail className="mx-auto text-[#8C948C] mb-2" size={24} />
            No inquiries received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#DED5C7] text-xs uppercase tracking-wider text-[#737D73]">
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED5C7]/60">
                {stats.recentContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#EDE7DE]/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-[#242824]">{c.name}</div>
                      <div className="text-xs text-[#737D73]">{c.email}</div>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[#5A625A]">
                      {c.service_type || "General Consultation"}
                    </td>
                    <td className="py-3.5 pr-4 text-xs">
                      {c.responded ? (
                        <span className="inline-flex items-center gap-1 text-[#444D37] font-medium bg-[#EDF1EA] px-2 py-0.5 rounded-full border border-[#D5DEC4]">
                          <FiCheckCircle size={12} className="text-[#586348]" /> Responded
                        </span>
                      ) : !c.read ? (
                        <span className="inline-flex items-center gap-1 text-[#B86B52] font-semibold bg-[#B86B52]/10 px-2 py-0.5 rounded-full border border-[#B86B52]/20">
                          <FiClock size={12} /> Unread
                        </span>
                      ) : (
                        <span className="text-[#737D73]">Read</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[#737D73]">
                      {new Date(c.submitted_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href="/admin/contacts"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348] text-xs text-[#586348] font-semibold transition-colors"
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
