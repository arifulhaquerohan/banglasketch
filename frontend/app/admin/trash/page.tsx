"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FiTrash2,
  FiRotateCcw,
  FiRefreshCw,
  FiImage,
  FiFileText,
  FiStar,
  FiVideo,
  FiMail,
  FiAlertTriangle,
} from "react-icons/fi";
import { adminFetch } from "@/lib/api";

type EntityType = "projects" | "blog" | "testimonials" | "videos" | "contacts";

interface TrashItem {
  id: string | number;
  title?: string;
  client_name?: string;
  name?: string;
  slug?: string;
  category?: string;
  quote?: string;
  email?: string;
  deleted_at?: string;
  created_at?: string;
  submitted_at?: string;
}

const TABS: { id: EntityType; label: string; table: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "projects", label: "Projects", table: "projects", icon: FiImage },
  { id: "blog", label: "Blog Posts", table: "blog_posts", icon: FiFileText },
  { id: "testimonials", label: "Testimonials", table: "testimonials", icon: FiStar },
  { id: "videos", label: "Videos", table: "videos", icon: FiVideo },
  { id: "contacts", label: "Contacts", table: "contact_submissions", icon: FiMail },
];

export default function RecycleBinPage() {
  const [activeTab, setActiveTab] = useState<EntityType>("projects");
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const currentTabConfig = TABS.find((t) => t.id === activeTab) || TABS[0];

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const result = await adminFetch<TrashItem[]>(`${activeTab}?trash=true`);
    if (result.success && Array.isArray(result.data)) {
      setItems(result.data);
    } else {
      setItems([]);
      if (result.error) setMessage({ text: result.error, type: "error" });
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (item: TrashItem) => {
    setActionId(item.id);
    setMessage(null);
    const result = await adminFetch(`restore/${currentTabConfig.table}/${item.id}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (result.success) {
      setMessage({ text: `Successfully restored item #${item.id}`, type: "success" });
      setItems((prev) => prev.filter((i) => String(i.id) !== String(item.id)));
    } else {
      setMessage({ text: result.error || "Failed to restore item", type: "error" });
    }
    setActionId(null);
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    const itemName = item.title || item.client_name || item.name || `#${item.id}`;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete “${itemName}”? This will remove all database records and associated media files. This action CANNOT be undone.`
      )
    ) {
      return;
    }

    setActionId(item.id);
    setMessage(null);
    const result = await adminFetch(`trash/${currentTabConfig.table}/${item.id}`, {
      method: "DELETE",
    });
    if (result.success) {
      setMessage({ text: `Permanently deleted “${itemName}”`, type: "success" });
      setItems((prev) => prev.filter((i) => String(i.id) !== String(item.id)));
    } else {
      setMessage({ text: result.error || "Failed to permanently delete item", type: "error" });
    }
    setActionId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#242824] tracking-tight flex items-center gap-2">
            <FiTrash2 className="text-[#586348]" /> Recycle Bin
          </h1>
          <p className="text-sm text-[#5A625A] mt-1">
            Recover soft-deleted items or permanently purge them to free up server storage.
          </p>
        </div>
        <button
          onClick={loadTrash}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] hover:border-[#586348] text-xs font-semibold text-[#242824] transition-colors shadow-xs self-start sm:self-auto disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin text-[#586348]" : "text-[#586348]"} size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#DED5C7] pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#586348] text-white shadow-xs"
                  : "bg-[#FCFAF7] text-[#5A625A] hover:text-[#242824] hover:bg-[#F5F2EB] border border-[#DED5C7]"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div
          role="alert"
          className={`rounded-2xl px-4 py-3 text-xs font-medium flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <FiAlertTriangle size={15} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Content Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-16 rounded-2xl bg-[#EDE7DE] animate-pulse border border-[#DED5C7]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F5F2EB] border border-[#DED5C7] flex items-center justify-center text-[#586348] mb-3">
            <FiTrash2 size={22} />
          </div>
          <h3 className="font-serif text-base font-bold text-[#242824] mb-1">Recycle bin is empty</h3>
          <p className="text-xs text-[#5A625A]">
            No deleted items found in {currentTabConfig.label.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#586348] bg-[#F5F2EB] border-b border-[#DED5C7] text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Item Details</th>
                <th className="p-4">Category / Info</th>
                <th className="p-4">Deleted At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DED5C7] bg-white">
              {items.map((item) => {
                const title = item.title || item.client_name || item.name || `Item #${item.id}`;
                const subtitle = item.slug || item.email || (item.quote ? `“${item.quote.slice(0, 60)}...”` : null);
                const isOperating = actionId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-[#242824]">{title}</div>
                      {subtitle && <div className="text-xs text-[#5A625A] mt-0.5">{subtitle}</div>}
                    </td>
                    <td className="p-4 text-xs">
                      {item.category ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EDF1EA] text-[#444D37] border border-[#D5DEC4] font-medium">
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-[#8C948C]">—</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-[#737D73] tabular-nums">
                      {item.deleted_at ? new Date(item.deleted_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : "Recently"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(item)}
                          disabled={isOperating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          <FiRotateCcw size={13} className={isOperating ? "animate-spin" : ""} />
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item)}
                          disabled={isOperating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-800 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <FiTrash2 size={13} />
                          Delete Forever
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
