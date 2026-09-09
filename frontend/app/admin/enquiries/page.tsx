"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiClock,
  FiAlertTriangle,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiMessageSquare,
  FiLayers,
  FiList,
} from "react-icons/fi";
import { adminFetch } from "@/lib/api";
import type { EnquiryDetail as Enquiry } from "@/types";

const STAGES = [
  { id: "new_enquiry", label: "New Enquiry", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  { id: "contacted", label: "Contacted", color: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
  { id: "consultation", label: "Consultation", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  { id: "site_visit", label: "Site Visit", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200" },
  { id: "proposal_sent", label: "Proposal Sent", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  { id: "approved", label: "Approved", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  { id: "active_project", label: "Active Project", color: "bg-[#586348]/15 text-[#586348] border-[#D5DEC4]" },
  { id: "handover", label: "Handover", color: "bg-stone-500/15 text-stone-700 border-stone-300" },
];

export default function EnquiriesPipelinePage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);
  const [tabFilter, setTabFilter] = useState<"pipeline" | "on_hold" | "closed">("pipeline");

  // Quick follow-up modal state
  const [activeFollowUpEnquiry, setActiveFollowUpEnquiry] = useState<Enquiry | null>(null);
  const [followUpChannel, setFollowUpChannel] = useState<"call" | "whatsapp" | "meeting" | "site_visit" | "note">("call");
  const [followUpSummary, setFollowUpSummary] = useState("");
  const [nextActionInput, setNextActionInput] = useState("");
  const [scheduledAtInput, setScheduledAtInput] = useState("");
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<Enquiry[]>("enquiries?limit=200");
    if (res.success && Array.isArray(res.data)) {
      setEnquiries(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      // Tab filter
      if (tabFilter === "pipeline" && ["on_hold", "closed"].includes(e.status)) return false;
      if (tabFilter === "on_hold" && e.status !== "on_hold") return false;
      if (tabFilter === "closed" && e.status !== "closed") return false;

      // Needs attention flag
      if (needsAttentionOnly) {
        const isOverdue = e.next_follow_up_date && new Date(e.next_follow_up_date) < new Date();
        const hasNoAction = !e.next_action || !e.next_action.trim();
        const isUnassigned = !e.assigned_to && e.status === "new_enquiry";
        if (!isOverdue && !hasNoAction && !isUnassigned) return false;
      }

      // Search term
      if (search.trim()) {
        const term = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(term) ||
          e.phone.toLowerCase().includes(term) ||
          e.project_location.toLowerCase().includes(term) ||
          (e.assigned_name || "").toLowerCase().includes(term) ||
          (e.notes || "").toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [enquiries, search, needsAttentionOnly, tabFilter]);

  const stats = useMemo(() => {
    const overdue = enquiries.filter(
      (e) =>
        e.next_follow_up_date &&
        new Date(e.next_follow_up_date) < new Date() &&
        !["closed", "handover"].includes(e.status)
    ).length;

    const noNextAction = enquiries.filter(
      (e) => (!e.next_action || !e.next_action.trim()) && !["closed", "handover"].includes(e.status)
    ).length;

    const newLeads = enquiries.filter((e) => e.status === "new_enquiry").length;

    return { overdue, noNextAction, newLeads, total: enquiries.length };
  }, [enquiries]);

  const handleStageChange = async (enquiryId: number, newStage: string) => {
    const res = await adminFetch<Enquiry>(`enquiries/${enquiryId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStage }),
    });
    if (res.success && res.data) {
      setEnquiries((prev) => prev.map((item) => (item.id === enquiryId ? { ...item, ...res.data } : item)));
    } else {
      alert(res.error || "Failed to update stage");
    }
  };

  const handleQuickFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFollowUpEnquiry || !followUpSummary.trim()) return;

    setSubmittingFollowUp(true);
    const res = await adminFetch(`enquiries/${activeFollowUpEnquiry.id}/follow-ups`, {
      method: "POST",
      body: JSON.stringify({
        channel: followUpChannel,
        summary: followUpSummary,
        next_action: nextActionInput || undefined,
        scheduled_at: scheduledAtInput ? new Date(scheduledAtInput).toISOString() : undefined,
      }),
    });

    setSubmittingFollowUp(false);
    if (res.success) {
      setActiveFollowUpEnquiry(null);
      setFollowUpSummary("");
      setNextActionInput("");
      setScheduledAtInput("");
      loadEnquiries();
    } else {
      alert(res.error || "Failed to record follow-up");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#242824]">
            Client Pipeline & Enquiries
          </h1>
          <p className="text-xs md:text-sm text-[#5A625A] mt-1">
            Track client journeys from new consultation request to handover. Never let a lead go cold.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              viewMode === "kanban"
                ? "bg-[#586348] text-white border-[#586348]"
                : "bg-white text-[#5A625A] border-[#DED5C7] hover:bg-[#F5F2EB]"
            }`}
          >
            <FiLayers size={14} /> Kanban Board
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              viewMode === "list"
                ? "bg-[#586348] text-white border-[#586348]"
                : "bg-white text-[#5A625A] border-[#DED5C7] hover:bg-[#F5F2EB]"
            }`}
          >
            <FiList size={14} /> Table View
          </button>
        </div>
      </div>

      {/* Actionable Health Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setNeedsAttentionOnly(false);
            setTabFilter("pipeline");
          }}
          className="p-4 bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl text-left hover:border-[#586348] transition-all"
        >
          <span className="text-xs text-[#5A625A] font-semibold uppercase tracking-wider block">New Enquiries</span>
          <span className="text-2xl font-bold text-[#242824] mt-1 block">{stats.newLeads}</span>
          <span className="text-[11px] text-[#788278]">Awaiting initial call</span>
        </button>

        <button
          onClick={() => {
            setNeedsAttentionOnly(true);
            setTabFilter("pipeline");
          }}
          className={`p-4 border rounded-2xl text-left transition-all ${
            stats.overdue > 0
              ? "bg-red-50/70 border-red-200 text-red-900"
              : "bg-[#FCFAF7] border-[#DED5C7] text-[#242824]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider block">Overdue Follow-ups</span>
            {stats.overdue > 0 && <FiAlertTriangle className="text-red-600" size={16} />}
          </div>
          <span className="text-2xl font-bold mt-1 block">{stats.overdue}</span>
          <span className="text-[11px] opacity-80">Requires immediate attention</span>
        </button>

        <button
          onClick={() => {
            setNeedsAttentionOnly(true);
            setTabFilter("pipeline");
          }}
          className={`p-4 border rounded-2xl text-left transition-all ${
            stats.noNextAction > 0
              ? "bg-amber-50/70 border-amber-200 text-amber-900"
              : "bg-[#FCFAF7] border-[#DED5C7] text-[#242824]"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider block">Missing Next Step</span>
          <span className="text-2xl font-bold mt-1 block">{stats.noNextAction}</span>
          <span className="text-[11px] opacity-80">Enquiries without next action</span>
        </button>

        <div className="p-4 bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl">
          <span className="text-xs text-[#5A625A] font-semibold uppercase tracking-wider block">Active Pipeline</span>
          <span className="text-2xl font-bold text-[#586348] mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-[#788278]">Total managed leads</span>
        </div>
      </div>

      {/* Filter and Tab bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#FCFAF7] p-3 rounded-2xl border border-[#DED5C7]">
        {/* Stage Tabs */}
        <div className="flex items-center gap-2 border-b md:border-b-0 pb-2 md:pb-0 border-[#DED5C7]">
          <button
            onClick={() => setTabFilter("pipeline")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tabFilter === "pipeline"
                ? "bg-[#242824] text-white"
                : "text-[#5A625A] hover:bg-[#F5F2EB]"
            }`}
          >
            Active Pipeline
          </button>
          <button
            onClick={() => setTabFilter("on_hold")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tabFilter === "on_hold"
                ? "bg-[#242824] text-white"
                : "text-[#5A625A] hover:bg-[#F5F2EB]"
            }`}
          >
            On Hold
          </button>
          <button
            onClick={() => setTabFilter("closed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tabFilter === "closed"
                ? "bg-[#242824] text-white"
                : "text-[#5A625A] hover:bg-[#F5F2EB]"
            }`}
          >
            Closed / Lost
          </button>
        </div>

        {/* Search & Attention toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#788278]" size={14} />
            <input
              type="text"
              placeholder="Search name, phone, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#DED5C7] rounded-xl focus:outline-none focus:border-[#586348]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#242824] cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={needsAttentionOnly}
              onChange={(e) => setNeedsAttentionOnly(e.target.checked)}
              className="accent-[#586348] rounded"
            />
            <span className="font-semibold text-red-600">Needs Attention Only</span>
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[#788278]">Loading client pipeline...</div>
      ) : viewMode === "kanban" && tabFilter === "pipeline" ? (
        /* KANBAN BOARD */
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
          {STAGES.map((stage) => {
            const stageLeads = filteredEnquiries.filter((e) => e.status === stage.id);
            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-[#F7F4EE] border border-[#DED5C7] rounded-2xl flex flex-col max-h-[78vh]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#DED5C7] flex items-center justify-between bg-[#F2EDE4] rounded-t-2xl">
                  <span className="font-semibold text-xs text-[#242824] uppercase tracking-wider">
                    {stage.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#FCFAF7] border border-[#DED5C7] text-[#5A625A]">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#8A948A] italic">No enquiries here</div>
                  ) : (
                    stageLeads.map((enquiry) => {
                      const isOverdue =
                        enquiry.is_overdue !== undefined
                          ? enquiry.is_overdue
                          : Boolean(
                              enquiry.next_follow_up_date &&
                              new Date(enquiry.next_follow_up_date) < new Date() &&
                              !["closed", "handover"].includes(enquiry.status)
                            );
                      const hasNoNextAction = !enquiry.next_action || !enquiry.next_action.trim();

                      return (
                        <div
                          key={enquiry.id}
                          className={`p-3.5 bg-white border rounded-xl shadow-2xs hover:shadow-xs transition-all ${
                            isOverdue
                              ? "border-red-400/80 ring-1 ring-red-400/30"
                              : hasNoNextAction
                              ? "border-amber-400/80"
                              : "border-[#DED5C7]"
                          }`}
                        >
                          {/* Alert badges */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {isOverdue && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                                <FiAlertTriangle size={10} /> Overdue
                              </span>
                            )}
                            {hasNoNextAction && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                No Next Action
                              </span>
                            )}
                            {!enquiry.assigned_to && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                Unassigned
                              </span>
                            )}
                          </div>

                          {/* Client & Space */}
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/admin/enquiries/${enquiry.id}`}
                              className="font-bold text-sm text-[#242824] hover:text-[#586348] transition-colors line-clamp-1"
                            >
                              {enquiry.name}
                            </Link>
                          </div>

                          <div className="space-y-1 mt-1.5 text-xs text-[#5A625A]">
                            <div className="flex items-center gap-1.5">
                              <FiPhone size={12} className="text-[#788278]" />
                              <span>{enquiry.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FiMapPin size={12} className="text-[#788278]" />
                              <span>{enquiry.project_location}</span>
                            </div>
                          </div>

                          {/* Next step info */}
                          <div className="mt-3 pt-2.5 border-t border-[#F0EBE1] text-[11px]">
                            <div className="font-medium text-[#242824] flex items-center gap-1">
                              <span className="text-[#788278]">Next:</span>
                              <span className="truncate">{enquiry.next_action || "Schedule action"}</span>
                            </div>
                            {enquiry.next_follow_up_date && (
                              <div className="flex items-center gap-1 text-[#788278] mt-0.5">
                                <FiClock size={11} />
                                <span>{new Date(enquiry.next_follow_up_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Actions */}
                          <div className="mt-3 pt-2 border-t border-[#F0EBE1] flex items-center justify-between gap-1">
                            {/* Move Stage Selector */}
                            <select
                              value={enquiry.status}
                              onChange={(e) => handleStageChange(enquiry.id, e.target.value)}
                              className="text-[11px] bg-[#F5F2EB] border border-[#DED5C7] rounded-lg px-1.5 py-1 text-[#242824] focus:outline-none"
                            >
                              {STAGES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  → {s.label}
                                </option>
                              ))}
                              <option value="on_hold">⏸ On Hold</option>
                              <option value="closed">✕ Closed</option>
                            </select>

                            {/* Quick follow-up button */}
                            <button
                              onClick={() => {
                                setActiveFollowUpEnquiry(enquiry);
                                setNextActionInput(enquiry.next_action || "");
                              }}
                              title="Log Call or Note"
                              className="p-1.5 text-[#586348] hover:bg-[#F5F2EB] rounded-lg border border-[#D5DEC4]"
                            >
                              <FiMessageSquare size={13} />
                            </button>

                            {/* Link to Dossier */}
                            <Link
                              href={`/admin/enquiries/${enquiry.id}`}
                              className="p-1.5 text-[#242824] hover:bg-[#F5F2EB] rounded-lg border border-[#DED5C7]"
                              title="Full Client File"
                            >
                              <FiArrowRight size={13} />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2EDE4] border-b border-[#DED5C7] text-[#586348] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Client & Location</th>
                <th className="p-3.5">Scope & Budget</th>
                <th className="p-3.5">Stage</th>
                <th className="p-3.5">Assigned Owner</th>
                <th className="p-3.5">Next Action & Due</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE4D8]">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#788278]">
                    No enquiries match the current filters.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-white transition-colors">
                    <td className="p-3.5">
                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="font-bold text-sm text-[#242824] hover:text-[#586348] block"
                      >
                        {enquiry.name}
                      </Link>
                      <span className="text-[#5A625A] block">{enquiry.phone}</span>
                      <span className="text-[11px] text-[#788278]">{enquiry.project_location}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize font-medium text-[#242824] block">
                        {enquiry.property_type} ({enquiry.service_scope.replace(/_/g, " ")})
                      </span>
                      <span className="text-[#788278] block">{enquiry.approx_budget || "Not specified"}</span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={enquiry.status}
                        onChange={(e) => handleStageChange(enquiry.id, e.target.value)}
                        className="text-xs font-medium bg-white border border-[#DED5C7] rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                        <option value="on_hold">On Hold</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-[#5A625A]">
                      {enquiry.assigned_name || (
                        <span className="text-blue-600 font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-[#242824] block line-clamp-1">
                        {enquiry.next_action || <span className="text-amber-600">None scheduled</span>}
                      </span>
                      {enquiry.next_follow_up_date && (
                        <span
                          className={`text-[11px] flex items-center gap-1 ${
                            new Date(enquiry.next_follow_up_date) < new Date() && !["closed", "handover"].includes(enquiry.status)
                              ? "text-red-600 font-bold"
                              : "text-[#788278]"
                          }`}
                        >
                          <FiClock size={11} />
                          {new Date(enquiry.next_follow_up_date).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveFollowUpEnquiry(enquiry);
                            setNextActionInput(enquiry.next_action || "");
                          }}
                          className="px-2.5 py-1 bg-[#EDF1EA] text-[#586348] rounded-lg text-xs font-semibold hover:bg-[#586348] hover:text-white transition-all"
                        >
                          + Log Note
                        </button>
                        <Link
                          href={`/admin/enquiries/${enquiry.id}`}
                          className="px-2.5 py-1 bg-white border border-[#DED5C7] text-[#242824] rounded-lg text-xs font-semibold hover:bg-[#F5F2EB]"
                        >
                          Dossier
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* QUICK FOLLOW-UP MODAL */}
      {activeFollowUpEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-serif text-xl font-bold text-[#242824]">
              Log Communication with {activeFollowUpEnquiry.name}
            </h3>
            <p className="text-xs text-[#5A625A] mt-1">
              Record details from a call, site meeting, or note to keep project history traceable.
            </p>

            <form onSubmit={handleQuickFollowUpSubmit} className="space-y-4 mt-5">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[#586348]">
                  Interaction Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(["call", "whatsapp", "meeting", "site_visit", "note"] as const).map((ch) => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => setFollowUpChannel(ch)}
                      className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                        followUpChannel === ch
                          ? "bg-[#586348] text-white border-[#586348]"
                          : "bg-white text-[#5A625A] border-[#DED5C7] hover:bg-[#F5F2EB]"
                      }`}
                    >
                      {ch.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[#586348]">
                  Discussion Summary / Findings *
                </label>
                <textarea
                  required
                  rows={3}
                  value={followUpSummary}
                  onChange={(e) => setFollowUpSummary(e.target.value)}
                  placeholder="e.g. Client requested revisions to kitchen island layout. Prefers dark walnut veneer finish..."
                  className="w-full bg-white border border-[#DED5C7] rounded-xl p-3 text-xs focus:outline-none focus:border-[#586348]"
                />
              </div>

              {/* Next Action & Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[#586348]">
                    Next Action Step
                  </label>
                  <input
                    type="text"
                    value={nextActionInput}
                    onChange={(e) => setNextActionInput(e.target.value)}
                    placeholder="e.g. Send revised 3D render"
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#586348]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[#586348]">
                    Follow-up Due Date
                  </label>
                  <input
                    type="date"
                    value={scheduledAtInput}
                    onChange={(e) => setScheduledAtInput(e.target.value)}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#586348]"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DED5C7]">
                <button
                  type="button"
                  onClick={() => setActiveFollowUpEnquiry(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#5A625A] hover:bg-[#F5F2EB] rounded-xl border border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFollowUp}
                  className="px-5 py-2 text-xs font-semibold bg-[#586348] text-white rounded-xl hover:bg-[#444D37] transition-all"
                >
                  {submittingFollowUp ? "Saving..." : "Save Follow-up Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
