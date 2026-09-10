"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiClock,
  FiPlus,
  FiCalendar,
  FiBriefcase,
  FiX,
  FiSend,
} from "react-icons/fi";
import { adminFetch } from "@/lib/api";
import type { Proposal, ChangeOrder, ClientProject as Project } from "@/types";

export default function ClientProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New Proposal Modal
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [newProposalCost, setNewProposalCost] = useState("");
  const [newProposalDays, setNewProposalDays] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Change Order Modal
  const [showNewChange, setShowNewChange] = useState(false);
  const [changeTitle, setChangeTitle] = useState("");
  const [changeDesc, setChangeDesc] = useState("");
  const [changeCost, setChangeCost] = useState("");
  const [changeDays, setChangeDays] = useState("");
  const [submittingChange, setSubmittingChange] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<{
      project: Project;
      proposals: Proposal[];
      changeOrders: ChangeOrder[];
    }>(`client-projects/${id}`);
    if (res.success && res.data) {
      setProject(res.data.project);
      setProposals(res.data.proposals);
      setChangeOrders(res.data.changeOrders);
    } else {
      setError(res.error || "Failed to load project data");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveProposal = async (proposalId: number, version: number) => {
    if (!window.confirm("Approve this proposal version and set as the agreed baseline?")) return;

    const res = await adminFetch(`proposals/${proposalId}/approve`, {
      method: "POST",
      body: JSON.stringify({ version }),
    });

    if (res.success) {
      alert("Proposal approved. Baseline budget has been updated.");
      loadData();
    } else {
      alert(res.error || "Failed to approve proposal");
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposalTitle.trim() || !newProposalCost) return;

    setSubmittingProposal(true);
    const res = await adminFetch(`client-projects/${id}/proposals`, {
      method: "POST",
      body: JSON.stringify({
        title: newProposalTitle,
        scope_summary: "Initial project scope and cost estimate.",
        proposed_cost: Number(newProposalCost),
        timeline_days: newProposalDays ? Number(newProposalDays) : null,
      }),
    });
    setSubmittingProposal(false);

    if (res.success) {
      setShowNewProposal(false);
      setNewProposalTitle("");
      setNewProposalCost("");
      setNewProposalDays("");
      loadData();
    } else {
      alert(res.error || "Failed to create proposal");
    }
  };

  const handleCreateChangeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeTitle.trim() || !changeDesc.trim() || !changeCost) return;

    setSubmittingChange(true);
    const res = await adminFetch(`client-projects/${id}/change-orders`, {
      method: "POST",
      body: JSON.stringify({
        title: changeTitle,
        description: changeDesc,
        proposed_cost: Number(changeCost),
        timeline_impact_days: changeDays ? Number(changeDays) : 0,
      }),
    });
    setSubmittingChange(false);

    if (res.success) {
      setShowNewChange(false);
      setChangeTitle("");
      setChangeDesc("");
      setChangeCost("");
      setChangeDays("");
      loadData();
    } else {
      alert(res.error || "Failed to create change order");
    }
  };

  const handleDecision = async (changeId: number, status: "approved" | "rejected") => {
    const res = await adminFetch(`change-orders/${changeId}/decision`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });

    if (res.success) {
      loadData();
    } else {
      alert(res.error || "Failed to record decision");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-[#788278]">Loading project details...</div>;
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl">
        <p>{error || "Project not found"}</p>
        <Link
          href="/admin/client-projects"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FCFAF7] border border-[#DED5C7] text-xs font-semibold text-[#242824] hover:border-[#586348] transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const hasApprovedProposal = proposals.some((p) => p.status === "approved");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/client-projects"
            className="p-2 bg-white border border-[#DED5C7] rounded-xl hover:bg-[#F5F2EB] text-[#242824]"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#242824]">{project.title}</h1>
            <p className="text-xs text-[#5A625A] mt-0.5">
              Client: {project.client_name} • {project.client_phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 bg-[#586348]/15 text-[#586348] rounded-xl text-xs font-bold uppercase tracking-wider border border-[#D5DEC4]">
            {project.stage.replace(/_/g, " ")}
          </span>
          <span className="px-3 py-1.5 bg-white border border-[#DED5C7] text-[#242824] rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <FiDollarSign size={13} />
            Agreed: BDT {Number(project.agreed_budget).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Grid: Left project overview, Right milestone tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project Overview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-[#586348] uppercase tracking-wider mb-3">Project Overview</h2>
            <div className="space-y-3 text-xs text-[#242824]">
              <div className="flex justify-between">
                <span className="text-[#788278]">Project Manager</span>
                <span className="font-semibold">{project.project_manager_name || "Unassigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#788278]">Client Email</span>
                <a
                  href={`mailto:${project.client_email || ""}`}
                  className="text-[#586348] hover:underline"
                >
                  {project.client_email || "N/A"}
                </a>
              </div>
              {project.target_completion_date && (
                <div className="flex justify-between">
                  <span className="text-[#788278]">Target Completion</span>
                  <span className="font-semibold">
                    {new Date(project.target_completion_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {project.agreed_scope && (
            <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
              <h2 className="font-semibold text-sm text-[#586348] uppercase tracking-wider mb-2">
                Agreed Scope
              </h2>
              <p className="text-xs text-[#242824] leading-relaxed">{project.agreed_scope}</p>
            </div>
          )}

          {/* Portal token for client access */}
          {project.portal_token && (
            <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
              <h2 className="font-semibold text-sm text-[#586348] uppercase tracking-wider mb-2">
                Client Portal Access
              </h2>
              <p className="text-[11px] text-[#788278] mb-2">
                Share this secure link with the client for their private portal.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-[#DED5C7] rounded-lg px-3 py-2 text-[11px] text-[#5A625A] break-all">
                  {typeof window !== "undefined" && window.location.origin}/portal/{project.portal_token}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/portal/${project.portal_token}`)}
                  className="px-2.5 py-2 bg-[#586348] text-white rounded-lg text-xs font-semibold hover:bg-[#444D37]"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Project Pipeline & Milestones */}
        <div className="lg:col-span-7 space-y-4">
          {/* Milestone Tracker */}
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-[#586348] uppercase tracking-wider mb-3">
              Milestone Tracker
            </h2>
            <div className="space-y-2 text-xs">
              {hasApprovedProposal ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <FiCheckCircle className="text-emerald-600" size={16} />
                  <span className="font-semibold text-emerald-900">Approved Proposal (Baseline Locked)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <FiClock className="text-amber-600" size={16} />
                  <span className="font-medium text-amber-900">
                    {proposals.length > 0 ? "Proposal Pending Approval" : "No Approved Proposal"}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-[#F5F2EB] border border-[#DED5C7] rounded-xl">
                <FiClock className="text-[#788278]" size={16} />
                <span className="text-[#242824]">
                  Current: {project.current_milestone || "Detailed Design & Layout Approval"}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white border border-[#DED5C7] rounded-xl">
                <FiCalendar className="text-[#788278]" size={16} />
                <span className="text-[#5A625A]">
                  Next: {project.next_milestone || "Construction & Installation"}
                </span>
              </div>
            </div>
          </div>

          {/* Proposals & Approvals Section */}
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-[#586348] uppercase tracking-wider flex items-center gap-2">
                <FiFileText size={14} />
                Proposals & Signoffs
              </h2>
              <button
                onClick={() => setShowNewProposal(true)}
                className="px-3 py-1.5 bg-[#586348] text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-[#444D37]"
              >
                <FiPlus size={13} /> New Proposal
              </button>
            </div>

            {proposals.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#788278]">
                No proposals created yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white border border-[#DED5C7] rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-[#242824]">{proposal.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          proposal.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : proposal.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : proposal.status === "sent"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#F5F2EB] text-[#5A625A]"
                        }`}
                      >
                        {proposal.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {proposal.versions && proposal.versions.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {proposal.versions.map((v) => (
                          <div
                            key={v.version}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                              proposal.status === "approved" && proposal.approved_version === v.version
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-[#F7F4EE] border-[#EBE4D8]"
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-[#242824]">
                                Version {v.version}
                                {proposal.approved_version === v.version && (
                                  <span className="ml-2 text-emerald-600">✓ Approved</span>
                                )}
                              </div>
                              <div className="text-[#788278] text-[11px]">
                                {new Date(v.created_at).toLocaleDateString()} •
                                BDT {Number(v.proposed_cost).toLocaleString()}
                                {v.timeline_days && ` • ${v.timeline_days} days`}
                              </div>
                            </div>
                            {proposal.status !== "approved" && (
                              <button
                                onClick={() => handleApproveProposal(proposal.id, v.version)}
                                className="px-2.5 py-1 bg-[#586348] text-white rounded-lg text-[11px] font-semibold hover:bg-[#444D37]"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Orders (Scope Add-ons) */}
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-[#586348] uppercase tracking-wider flex items-center gap-2">
                <FiBriefcase size={14} />
                Change Orders & Additional Scope
              </h2>
              <button
                onClick={() => setShowNewChange(true)}
                className="px-3 py-1.5 bg-[#242824] text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-[#181C18]"
              >
                <FiPlus size={13} /> Log Change
              </button>
            </div>

            {changeOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#788278]">
                No additional scope change orders recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {changeOrders.map((co) => (
                  <div
                    key={co.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      co.status === "approved"
                        ? "bg-emerald-50 border-emerald-200"
                        : co.status === "rejected"
                        ? "bg-red-50 border-red-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#242824]">{co.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          co.status === "approved"
                            ? "bg-emerald-200 text-emerald-900"
                            : co.status === "rejected"
                            ? "bg-red-200 text-red-900"
                            : "bg-amber-200 text-amber-900"
                        }`}
                      >
                        {co.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[#5A625A] leading-relaxed">{co.description}</p>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/50 text-[11px]">
                      <span className="font-semibold text-[#242824]">
                        Proposed: BDT {Number(co.proposed_cost).toLocaleString()}
                      </span>
                      <span className="text-[#788278]">
                        +{co.timeline_impact_days} days
                      </span>
                      {co.decided_at && (
                        <span className="text-[#788278]">
                          Decided: {new Date(co.decided_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {co.status === "pending_approval" && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/50">
                        <button
                          onClick={() => handleDecision(co.id, "approved")}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700"
                        >
                          Approve & Add to Scope
                        </button>
                        <button
                          onClick={() => handleDecision(co.id, "rejected")}
                          className="px-3 py-1 bg-white border border-red-300 text-red-700 rounded-lg text-[11px] font-semibold hover:bg-red-50"
                        >
                          Reject Change
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create New Proposal Modal */}
      {showNewProposal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-[#242824]">Create New Proposal</h3>
              <button
                onClick={() => setShowNewProposal(false)}
                className="p-1 hover:bg-[#F5F2EB] rounded-lg"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProposal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#788278] font-medium mb-1">Proposal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Interior Design - Phase 1 Proposal"
                  value={newProposalTitle}
                  onChange={(e) => setNewProposalTitle(e.target.value)}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#586348]"
                />
              </div>
              <div>
                <label className="block text-[#788278] font-medium mb-1">Proposed Budget (BDT)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500000"
                  value={newProposalCost}
                  onChange={(e) => setNewProposalCost(e.target.value)}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#586348]"
                />
              </div>
              <div>
                <label className="block text-[#788278] font-medium mb-1">Estimated Timeline (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={newProposalDays}
                  onChange={(e) => setNewProposalDays(e.target.value)}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#586348]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProposal(false)}
                  className="px-4 py-2 text-[#5A625A] hover:bg-[#F5F2EB] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="px-4 py-2 bg-[#586348] text-white rounded-xl font-semibold hover:bg-[#444D37]"
                >
                  {submittingProposal ? "Creating..." : "Create Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Change Order Modal */}
      {showNewChange && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-[#242824]">
                Log Scope Change / Variation
              </h3>
              <button
                onClick={() => setShowNewChange(false)}
                className="p-1 hover:bg-[#F5F2EB] rounded-lg"
              >
                <FiX size={18} />
              </button>
            </div>
            <p className="text-[11px] text-[#788278] mb-4">
              Record additional work, materials, or variations from the approved baseline. This will await client approval.
            </p>
            <form onSubmit={handleCreateChangeOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#788278] font-medium mb-1">Change Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom Wardrobe Upgrade"
                  value={changeTitle}
                  onChange={(e) => setChangeTitle(e.target.value)}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#586348]"
                />
              </div>
              <div>
                <label className="block text-[#788278] font-medium mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the scope change, material specs, or variation from agreed scope..."
                  value={changeDesc}
                  onChange={(e) => setChangeDesc(e.target.value)}
                  className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#586348] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#788278] font-medium mb-1">Cost (BDT)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 120000"
                    value={changeCost}
                    onChange={(e) => setChangeCost(e.target.value)}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#586348]"
                  />
                </div>
                <div>
                  <label className="block text-[#788278] font-medium mb-1">Timeline Impact (Days)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={changeDays}
                    onChange={(e) => setChangeDays(e.target.value)}
                    className="w-full bg-white border border-[#DED5C7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#586348]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChange(false)}
                  className="px-4 py-2 text-[#5A625A] hover:bg-[#F5F2EB] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChange}
                  className="px-4 py-2 bg-[#242824] text-white rounded-xl font-semibold hover:bg-[#181C18] flex items-center gap-1.5"
                >
                  <FiSend size={13} />
                  {submittingChange ? "Submitting..." : "Log Change Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
