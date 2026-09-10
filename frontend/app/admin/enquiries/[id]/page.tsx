"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiMapPin,
  FiUser,
  FiSend,
  FiBriefcase,
} from "react-icons/fi";
import { adminFetch } from "@/lib/api";
import type { EnquiryDetail, FollowUp } from "@/types";

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<{ enquiry: EnquiryDetail; followUps: FollowUp[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit / Status Form
  const [status, setStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [updatingEnquiry, setUpdatingEnquiry] = useState(false);

  // New Follow-up log
  const [channel, setChannel] = useState<"call" | "whatsapp" | "meeting" | "site_visit" | "note">("call");
  const [summary, setSummary] = useState("");
  const [newNextAction, setNewNextAction] = useState("");
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Convert to Project
  const [converting, setConverting] = useState(false);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<{ enquiry: EnquiryDetail; followUps: FollowUp[] }>(`enquiries/${id}`);
    if (res.success && res.data) {
      setData(res.data);
      setStatus(res.data.enquiry.status);
      setStatusReason(res.data.enquiry.status_reason || "");
      setNextAction(res.data.enquiry.next_action || "");
      setNextFollowUpDate(
        res.data.enquiry.next_follow_up_date
          ? res.data.enquiry.next_follow_up_date.slice(0, 10)
          : ""
      );
    } else {
      setError(res.error || "Failed to load client record");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingEnquiry(true);
    const res = await adminFetch(`enquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        status_reason: statusReason || null,
        next_action: nextAction || null,
        next_follow_up_date: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null,
      }),
    });
    setUpdatingEnquiry(false);
    if (res.success) {
      alert("Enquiry status and follow-up updated successfully");
      loadDetails();
    } else {
      alert(res.error || "Failed to update enquiry");
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setSubmittingNote(true);
    const res = await adminFetch(`enquiries/${id}/follow-ups`, {
      method: "POST",
      body: JSON.stringify({
        channel,
        summary,
        next_action: newNextAction || undefined,
        scheduled_at: newScheduleDate ? new Date(newScheduleDate).toISOString() : undefined,
      }),
    });
    setSubmittingNote(false);
    if (res.success) {
      setSummary("");
      setNewNextAction("");
      setNewScheduleDate("");
      loadDetails();
    } else {
      alert(res.error || "Failed to add communication record");
    }
  };

  const handleConvertToProject = async () => {
    const budgetInput = window.prompt("Enter agreed project budget in BDT (or leave 0):", "0");
    if (budgetInput === null) return;
    const initialBudget = Number(budgetInput.replace(/[^0-9.]/g, "")) || 0;
    setConverting(true);
    const res = await adminFetch(`enquiries/${id}/convert-to-project`, {
      method: "POST",
      body: JSON.stringify({
        agreed_budget: initialBudget,
      }),
    });
    setConverting(false);
    if (res.success && res.data) {
      alert("Enquiry successfully converted to Active Project!");
      router.push(`/admin/client-projects/${res.data.id}`);
    } else {
      alert(res.error || "Failed to convert to project");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-[#788278]">Loading client record...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl">
        <p>{error || "Client record not found"}</p>
        <Link
          href="/admin/enquiries"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] text-xs font-semibold text-[#242824] hover:border-[#586348] transition-colors"
        >
          Return to Pipeline
        </Link>
      </div>
    );
  }

  const { enquiry, followUps } = data;
  const isOverdue =
    !["closed", "handover"].includes(enquiry.status) &&
    enquiry.next_follow_up_date &&
    new Date(enquiry.next_follow_up_date) < new Date();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/enquiries"
            className="p-2 bg-white border border-[#DED5C7] rounded-xl hover:bg-[#F5F2EB] text-[#242824]"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-[#242824]">{enquiry.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#586348]/15 text-[#586348] border border-[#D5DEC4]">
                {enquiry.status.replace(/_/g, " ")}
              </span>
              {isOverdue && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                  Follow-up Overdue
                </span>
              )}
            </div>
            <p className="text-xs text-[#5A625A] mt-0.5">
              Enquiry #{enquiry.id} • Created on {new Date(enquiry.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Promote to Project Button */}
        {enquiry.status !== "active_project" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleConvertToProject}
              disabled={converting}
              className="px-4 py-2 bg-[#586348] text-white rounded-xl text-xs font-semibold hover:bg-[#444D37] flex items-center gap-2 shadow-sm transition-all"
            >
              <FiBriefcase size={14} />
              <span>{converting ? "Promoting..." : "Convert to Active Project"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Left Dossier / Right Communication Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Client & Requirement Dossier (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Client Contact Profile */}
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#586348] block">
              Contact Details
            </span>

            <div className="space-y-2.5 text-xs text-[#242824]">
              <div className="flex items-center gap-3">
                <FiPhone className="text-[#788278]" size={14} />
                <a href={`tel:${enquiry.phone}`} className="font-bold hover:underline">
                  {enquiry.phone}
                </a>
                <a
                  href={`https://wa.me/${enquiry.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-semibold"
                >
                  WhatsApp
                </a>
              </div>

              {enquiry.email && (
                <div className="flex items-center gap-3">
                  <FiMail className="text-[#788278]" size={14} />
                  <a href={`mailto:${enquiry.email}`} className="hover:underline">
                    {enquiry.email}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3">
                <FiMapPin className="text-[#788278]" size={14} />
                <span>{enquiry.project_location}</span>
              </div>

              <div className="flex items-center gap-3">
                <FiUser className="text-[#788278]" size={14} />
                <span>Assigned: <strong>{enquiry.assigned_name || "Unassigned"}</strong></span>
              </div>
            </div>
          </div>

          {/* Project Requirements & Scope */}
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#586348] block">
              Project Requirements
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#EBE4D8]">
                <span className="text-[#788278] block text-[11px]">Space Type</span>
                <span className="font-semibold text-[#242824] capitalize">{enquiry.property_type}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#EBE4D8]">
                <span className="text-[#788278] block text-[11px]">Service Scope</span>
                <span className="font-semibold text-[#242824] capitalize">
                  {enquiry.service_scope.replace(/_/g, " ")}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#EBE4D8]">
                <span className="text-[#788278] block text-[11px]">Approximate Budget</span>
                <span className="font-semibold text-[#242824]">{enquiry.approx_budget || "Not stated"}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#EBE4D8]">
                <span className="text-[#788278] block text-[11px]">Target Start</span>
                <span className="font-semibold text-[#242824]">
                  {enquiry.preferred_start_date || "Flexible"}
                </span>
              </div>
            </div>

            {enquiry.notes && (
              <div className="pt-2">
                <span className="text-xs text-[#788278] block font-medium mb-1">Client Notes:</span>
                <p className="text-xs bg-white p-3 rounded-xl border border-[#EBE4D8] leading-relaxed text-[#242824]">
                  {enquiry.notes}
                </p>
              </div>
            )}
          </div>

          {/* Status & Next Step Controller */}
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#586348] block mb-3">
              Stage & Next Step Controller
            </span>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#788278] mb-1 font-medium">Pipeline Stage</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl p-2 font-medium"
                >
                  <option value="new_enquiry">New Enquiry</option>
                  <option value="contacted">Contacted</option>
                  <option value="consultation">Consultation Scheduled</option>
                  <option value="site_visit">Site Visit Completed</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="approved">Approved</option>
                  <option value="active_project">Active Project</option>
                  <option value="handover">Handover</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed / Lost</option>
                </select>
              </div>

              {(status === "on_hold" || status === "closed") && (
                <div>
                  <label className="block text-[#788278] mb-1 font-medium">Reason for Status</label>
                  <input
                    type="text"
                    placeholder="e.g. Budget mismatch / postponed to next year"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl p-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#788278] mb-1 font-medium">Next Action</label>
                <input
                  type="text"
                  placeholder="e.g. Call back with material samples"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl p-2"
                />
              </div>

              <div>
                <label className="block text-[#788278] mb-1 font-medium">Next Follow-up Due Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl p-2"
                />
              </div>

              <button
                type="submit"
                disabled={updatingEnquiry}
                className="w-full py-2.5 bg-[#242824] text-white rounded-xl font-semibold hover:bg-[#383E38] transition-all"
              >
                {updatingEnquiry ? "Saving..." : "Update Pipeline Stage & Step"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Communication History & Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Interaction Log Box */}
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#586348] block mb-3">
              Log Follow-up Interaction
            </span>

            <form onSubmit={handleAddFollowUp} className="space-y-3">
              {/* Interaction Type Badges */}
              <div className="flex flex-wrap gap-2">
                {(["call", "whatsapp", "meeting", "site_visit", "note"] as const).map((ch) => (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border capitalize transition-all ${
                      channel === ch
                        ? "bg-[#586348] text-white border-[#586348]"
                        : "bg-white text-[#5A625A] border-[#DED5C7] hover:bg-[#F5F2EB]"
                    }`}
                  >
                    {ch.replace("_", " ")}
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Log discussion notes, client preferences, or site measurement notes..."
                className="w-full bg-white border border-[#DED5C7] rounded-xl p-3 text-xs focus:outline-none focus:border-[#586348] resize-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Next Action Step"
                  value={newNextAction}
                  onChange={(e) => setNewNextAction(e.target.value)}
                  className="bg-white border border-[#DED5C7] rounded-xl px-3 py-2"
                />
                <input
                  type="date"
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  className="bg-white border border-[#DED5C7] rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="px-4 py-2 bg-[#586348] text-white rounded-xl text-xs font-semibold hover:bg-[#444D37] flex items-center gap-1.5 transition-all"
                >
                  <FiSend size={13} />
                  <span>{submittingNote ? "Saving..." : "Record Follow-up"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Chronological Timeline */}
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#586348] block mb-4">
              Communication & Activity History ({followUps.length})
            </span>

            {followUps.length === 0 ? (
              <p className="text-xs text-[#788278] italic">No communication logged yet.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#DED5C7]">
                {followUps.map((item) => (
                  <div key={item.id} className="relative pl-8 text-xs">
                    {/* Circle Node */}
                    <div className="absolute left-2 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-[#586348] border-2 border-white ring-1 ring-[#586348]/40" />

                    <div className="bg-white border border-[#EBE4D8] rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[#788278] text-[11px] mb-1">
                        <span className="font-bold text-[#586348] uppercase tracking-wider">
                          {item.channel.replace(/_/g, " ")}
                        </span>
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>

                      <p className="text-xs text-[#242824] leading-relaxed whitespace-pre-wrap">
                        {item.summary}
                      </p>

                      {item.next_action && (
                        <div className="mt-2 pt-2 border-t border-[#F5F2EB] text-[11px] text-[#5A625A]">
                          <strong>Next Action:</strong> {item.next_action}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
