"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiX,
  FiClock,
  FiRotateCcw,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import { adminFetch } from "@/lib/api";

interface VersionItem {
  id: number;
  version: number;
  snapshot: Record<string, any>;
  actor_id: number | null;
  created_at: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: "projects" | "blog_posts";
  entityId: string | number;
  onRestored?: () => void;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  entity,
  entityId,
  onRestored,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    if (!isOpen || !entityId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await adminFetch<VersionItem[]>(`versions/${entity}/${entityId}`);
    if (result.success && Array.isArray(result.data)) {
      setVersions(result.data);
      if (result.data.length > 0) {
        setSelectedVersion(result.data[0]);
      }
    } else {
      setError(result.error || "Unable to load version history.");
      setVersions([]);
    }
    setLoading(false);
  }, [isOpen, entity, entityId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  if (!isOpen) return null;

  const handleRestore = async (versionNum: number) => {
    if (!window.confirm(`Are you sure you want to revert to Version ${versionNum}? Current draft changes will be replaced.`)) {
      return;
    }

    setRestoring(true);
    setError(null);
    setSuccess(null);

    const result = await adminFetch(`restore/${entity}/${entityId}`, {
      method: "POST",
      body: JSON.stringify({ version: versionNum }),
    });

    setRestoring(false);

    if (result.success) {
      setSuccess(`Successfully restored to version ${versionNum}!`);
      if (onRestored) {
        setTimeout(() => {
          onRestored();
          onClose();
        }, 800);
      }
    } else {
      setError(result.error || "Failed to restore version.");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#242824]/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DED5C7] bg-[#F5F2EB]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#EDF1EA] text-[#586348] border border-[#D5DEC4]">
              <FiClock size={18} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#242824]">Version History & Revisions</h2>
              <p className="text-xs text-[#5A625A]">
                Browse point-in-time snapshots and restore any previous version.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737D73] hover:text-[#242824] hover:bg-[#EDE7DE] transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <FiAlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <FiCheckCircle size={14} />
            <span>{success}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-hidden p-6 grid md:grid-cols-12 gap-6">
          {/* Versions List (Left) */}
          <div className="md:col-span-5 flex flex-col border border-[#DED5C7] rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="px-4 py-2.5 bg-[#F5F2EB] border-b border-[#DED5C7] text-xs font-semibold text-[#586348] flex items-center justify-between uppercase tracking-wider">
              <span>Saved Versions ({versions.length})</span>
              <button
                onClick={loadVersions}
                disabled={loading}
                className="text-[#737D73] hover:text-[#242824] transition-colors"
                title="Refresh"
              >
                <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#DED5C7] max-h-[360px]">
              {loading ? (
                <div className="p-6 text-center text-xs text-[#737D73]">Loading revisions...</div>
              ) : versions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737D73]">
                  No recorded revisions yet for this item.
                </div>
              ) : (
                versions.map((item) => {
                  const isSelected = selectedVersion?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedVersion(item)}
                      className={`w-full text-left p-3.5 text-xs transition-colors flex flex-col gap-1 ${
                        isSelected
                          ? "bg-[#EDF1EA] border-l-4 border-[#586348]"
                          : "hover:bg-[#F5F2EB]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#242824]">Version #{item.version}</span>
                        <span className="text-[10px] text-[#737D73] tabular-nums">
                          {new Date(item.created_at).toLocaleDateString("en-GB", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5A625A] truncate">
                        {item.snapshot?.title || "Untitled"}
                      </div>
                      <div className="text-[10px] text-[#8C948C] tabular-nums">
                        {new Date(item.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Version Preview (Right) */}
          <div className="md:col-span-7 flex flex-col border border-[#DED5C7] rounded-2xl overflow-hidden bg-white p-5 shadow-2xs">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#DED5C7] pb-3">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#586348] font-bold">
                        Snapshot Preview (v{selectedVersion.version})
                      </span>
                      <div className="text-[11px] text-[#737D73] mt-0.5">
                        Saved on {new Date(selectedVersion.created_at).toLocaleString("en-GB")}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase font-semibold text-[#586348] tracking-wider block mb-1">
                      Title
                    </label>
                    <div className="text-sm font-semibold text-[#242824] bg-[#FCFAF7] p-2.5 rounded-xl border border-[#DED5C7]">
                      {selectedVersion.snapshot?.title || "—"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] uppercase font-semibold text-[#586348] tracking-wider block mb-1">
                        Category
                      </label>
                      <div className="text-xs font-medium text-[#242824] bg-[#FCFAF7] p-2.5 rounded-xl border border-[#DED5C7] truncate">
                        {selectedVersion.snapshot?.category || "—"}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase font-semibold text-[#586348] tracking-wider block mb-1">
                        Status
                      </label>
                      <div className="text-xs font-medium text-[#242824] bg-[#FCFAF7] p-2.5 rounded-xl border border-[#DED5C7]">
                        {selectedVersion.snapshot?.published ? "Published" : "Draft"}
                      </div>
                    </div>
                  </div>

                  {selectedVersion.snapshot?.slug && (
                    <div>
                      <label className="text-[11px] uppercase font-semibold text-[#586348] tracking-wider block mb-1">
                        Slug
                      </label>
                      <div className="text-xs font-mono text-[#5A625A] bg-[#FCFAF7] p-2.5 rounded-xl border border-[#DED5C7] truncate">
                        {selectedVersion.snapshot.slug}
                      </div>
                    </div>
                  )}

                  {(selectedVersion.snapshot?.description || selectedVersion.snapshot?.excerpt) && (
                    <div>
                      <label className="text-[11px] uppercase font-semibold text-[#586348] tracking-wider block mb-1">
                        Summary / Excerpt
                      </label>
                      <div className="text-xs text-[#5A625A] bg-[#FCFAF7] p-3 rounded-xl border border-[#DED5C7] max-h-28 overflow-y-auto leading-relaxed">
                        {selectedVersion.snapshot.description || selectedVersion.snapshot.excerpt}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#DED5C7] flex justify-end">
                  <button
                    onClick={() => handleRestore(selectedVersion.version)}
                    disabled={restoring}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#586348] hover:bg-[#444D37] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <FiRotateCcw size={13} className={restoring ? "animate-spin" : ""} />
                    {restoring ? "Restoring..." : `Revert to Version ${selectedVersion.version}`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#737D73]">
                Select a version to preview its snapshot.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F5F2EB] border-t border-[#DED5C7] flex justify-between items-center text-xs text-[#5A625A]">
          <span>Reverting replaces the current item draft with the selected snapshot.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#DED5C7] bg-white text-[#242824] hover:bg-[#EDE7DE] font-semibold transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
