"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiShield,
  FiPhone,
  FiMail,
  FiExternalLink,
  FiAlertCircle,
  FiLayers,
} from "react-icons/fi";

interface ClientInfo {
  name: string;
  email?: string;
  phone: string;
  memberSince: string;
}

interface ProposalDoc {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

interface PortalProposalVersion {
  id: number;
  version: number;
  scope_summary: string;
  proposed_cost: number | string;
  timeline_days?: number;
  documents: ProposalDoc[];
  created_at: string;
}

interface PortalProposal {
  id: number;
  project_id: number;
  title: string;
  status: string;
  approved_version?: number;
  approved_at?: string;
  versions: PortalProposalVersion[];
}

interface PortalChangeOrder {
  id: number;
  project_id: number;
  title: string;
  description: string;
  proposed_cost: number | string;
  timeline_impact_days: number;
  status: string;
  client_notes?: string;
  decided_at?: string;
  created_at: string;
}

interface PortalProject {
  id: number;
  title: string;
  stage: string;
  current_milestone?: string;
  next_milestone?: string;
  agreed_scope?: string;
  agreed_budget: number | string;
  target_completion_date?: string;
  project_manager_name?: string;
  created_at: string;
  updated_at: string;
  proposals: PortalProposal[];
  changeOrders: PortalChangeOrder[];
}

interface PortalData {
  client: ClientInfo;
  projects: PortalProject[];
  enquiries: Array<{
    id: number;
    project_location: string;
    property_type: string;
    service_scope: string;
    status: string;
    approx_budget?: string;
    created_at: string;
  }>;
}

export default function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadPortal() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/v1/portal/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!isMounted) return;
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || "Unable to find client portal. The link may have expired.");
        }
      } catch {
        if (isMounted) {
          setError("Failed to connect to the portal service. Please try again shortly.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPortal();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#586348] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#586348] tracking-wider uppercase">
            Loading Client Portal...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#DED5C7] rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <FiAlertCircle size={24} />
          </div>
          <h1 className="font-serif text-xl font-bold text-[#242824]">Portal Access Unavailable</h1>
          <p className="text-xs text-[#5A625A] leading-relaxed">
            {error || "This client portal link is not active or could not be verified."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-[#586348] text-white rounded-xl text-xs font-semibold hover:bg-[#444D37] transition"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { client, projects } = data;

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#242824] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Branding & Verification */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DED5C7] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-[#242824]">
                BANGLA SKETCH
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-[#586348]/10 text-[#586348] px-2 py-0.5 rounded-full border border-[#586348]/20">
                Client Portal
              </span>
            </div>
            <p className="text-xs text-[#5A625A] mt-1">
              Private Project & Milestone Dashboard
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-medium self-start sm:self-auto">
            <FiShield size={14} className="text-emerald-600" />
            <span>Verified Secure Access</span>
          </div>
        </div>

        {/* Client Welcome Header */}
        <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-2">
          <p className="text-xs font-semibold tracking-wider text-[#586348] uppercase">
            Client Account
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#242824]">
            Welcome, {client.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A625A] pt-2">
            <span className="flex items-center gap-1.5">
              <FiPhone size={13} className="text-[#788278]" />
              {client.phone}
            </span>
            {client.email && (
              <span className="flex items-center gap-1.5">
                <FiMail size={13} className="text-[#788278]" />
                {client.email}
              </span>
            )}
            <span className="text-[#788278]">•</span>
            <span>
              Member since {new Date(client.memberSince).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Projects Listing */}
        {projects.length === 0 ? (
          <div className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] border border-[#DED5C7] flex items-center justify-center mx-auto text-[#586348]">
              <FiLayers size={22} />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#242824]">Consultation in Progress</h2>
            <p className="text-xs text-[#5A625A] max-w-md mx-auto leading-relaxed">
              Your project file is currently being prepared by our architectural team. Once your project baseline is finalized, full timeline milestones and proposals will be visible here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {projects.map((proj) => {
              const approvedChangesTotal = proj.changeOrders
                ?.filter((co) => co.status === "approved")
                .reduce((acc, co) => acc + Number(co.proposed_cost || 0), 0) || 0;
              const baselineBudget = Number(proj.agreed_budget || 0);
              const totalActiveBudget = baselineBudget + approvedChangesTotal;

              return (
                <div
                  key={proj.id}
                  className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 space-y-6"
                >
                  {/* Project Top Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#DED5C7] pb-5">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#242824]">
                        {proj.title}
                      </h2>
                      {proj.project_manager_name && (
                        <p className="text-xs text-[#5A625A] mt-1">
                          Project Lead: <span className="font-medium text-[#242824]">{proj.project_manager_name}</span>
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-[#586348]/10 text-[#586348] border border-[#586348]/25 rounded-xl text-xs font-bold uppercase tracking-wider self-start md:self-auto">
                      {proj.stage.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Milestones & Schedule Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#DED5C7] rounded-2xl p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#586348] uppercase tracking-wider">
                        <FiClock size={13} />
                        Current Milestone
                      </div>
                      <p className="text-sm font-semibold text-[#242824] pt-1">
                        {proj.current_milestone || "Detailed Design & Layout Planning"}
                      </p>
                    </div>

                    <div className="bg-white border border-[#DED5C7] rounded-2xl p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#788278] uppercase tracking-wider">
                        <FiCalendar size={13} />
                        Upcoming Milestone
                      </div>
                      <p className="text-sm font-semibold text-[#242824] pt-1">
                        {proj.next_milestone || "Execution & Material Procurement"}
                      </p>
                    </div>

                    <div className="bg-white border border-[#DED5C7] rounded-2xl p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#788278] uppercase tracking-wider">
                        <FiCheckCircle size={13} />
                        Target Completion
                      </div>
                      <p className="text-sm font-semibold text-[#242824] pt-1">
                        {proj.target_completion_date
                          ? new Date(proj.target_completion_date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "To be finalized"}
                      </p>
                    </div>
                  </div>

                  {/* Agreed Scope */}
                  {proj.agreed_scope && (
                    <div className="bg-white border border-[#DED5C7] rounded-2xl p-5 space-y-2">
                      <h3 className="text-xs font-semibold text-[#586348] uppercase tracking-wider">
                        Project Scope & Requirements
                      </h3>
                      <p className="text-xs text-[#242824] leading-relaxed whitespace-pre-line">
                        {proj.agreed_scope}
                      </p>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="bg-white border border-[#DED5C7] rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-semibold text-[#586348] uppercase tracking-wider flex items-center gap-1.5">
                      <FiDollarSign size={14} />
                      Budget & Sign-off Overview
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 bg-[#F7F4EE] rounded-xl">
                        <div className="text-[#788278] text-[11px]">Agreed Baseline Budget</div>
                        <div className="text-sm font-bold text-[#242824] mt-0.5">
                          BDT {baselineBudget.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-[#F7F4EE] rounded-xl">
                        <div className="text-[#788278] text-[11px]">Approved Scope Adjustments</div>
                        <div className="text-sm font-bold text-[#242824] mt-0.5">
                          BDT {approvedChangesTotal.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="text-emerald-800 text-[11px] font-semibold">Total Working Budget</div>
                        <div className="text-sm font-bold text-emerald-950 mt-0.5">
                          BDT {totalActiveBudget.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposals & Signoffs */}
                  {proj.proposals && proj.proposals.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-[#586348] uppercase tracking-wider flex items-center gap-1.5">
                        <FiFileText size={14} />
                        Proposals & Specifications
                      </h3>
                      <div className="space-y-3">
                        {proj.proposals.map((prop) => (
                          <div
                            key={prop.id}
                            className="bg-white border border-[#DED5C7] rounded-2xl p-5 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-[#242824]">{prop.title}</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  prop.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : prop.status === "sent"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-[#F5F2EB] text-[#5A625A]"
                                }`}
                              >
                                {prop.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            {prop.versions && prop.versions.length > 0 && (
                              <div className="space-y-2 pt-1">
                                {prop.versions.map((ver) => (
                                  <div
                                    key={ver.version}
                                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                      prop.status === "approved" && prop.approved_version === ver.version
                                        ? "bg-emerald-50/60 border-emerald-200"
                                        : "bg-[#FCFAF7] border-[#EBE4D8]"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-medium">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-[#242824]">
                                          Version {ver.version}
                                        </span>
                                        {prop.approved_version === ver.version && (
                                          <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                            <FiCheckCircle size={12} /> Approved Baseline
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-bold text-[#242824]">
                                        BDT {Number(ver.proposed_cost).toLocaleString()}
                                      </span>
                                    </div>

                                    <p className="text-[#5A625A] text-[11px] leading-relaxed">
                                      {ver.scope_summary}
                                    </p>

                                    {ver.documents && ver.documents.length > 0 && (
                                      <div className="flex flex-wrap gap-2 pt-1">
                                        {ver.documents.map((doc, idx) => (
                                          <a
                                            key={idx}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] bg-white border border-[#DED5C7] px-2.5 py-1 rounded-lg text-[#586348] font-semibold hover:border-[#586348] transition"
                                          >
                                            <FiFileText size={11} />
                                            {doc.name || "Attachment"}
                                            <FiExternalLink size={10} />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Change Orders Section */}
                  {proj.changeOrders && proj.changeOrders.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-[#586348] uppercase tracking-wider">
                        Scope Changes & Adjustments
                      </h3>
                      <div className="space-y-2">
                        {proj.changeOrders.map((co) => (
                          <div
                            key={co.id}
                            className="bg-white border border-[#DED5C7] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-[#242824]">{co.title}</div>
                              <div className="text-[11px] text-[#5A625A] mt-0.5">{co.description}</div>
                              {co.timeline_impact_days > 0 && (
                                <div className="text-[10px] text-[#788278] mt-1">
                                  Timeline adjustment: +{co.timeline_impact_days} days
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <span className="font-bold text-[#242824]">
                                BDT {Number(co.proposed_cost).toLocaleString()}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  co.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : co.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {co.status.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Support & Contact Footer */}
        <div className="bg-white border border-[#DED5C7] rounded-3xl p-6 sm:p-8 text-center space-y-3">
          <h3 className="font-serif text-lg font-bold text-[#242824]">
            Questions About Your Project?
          </h3>
          <p className="text-xs text-[#5A625A] max-w-lg mx-auto leading-relaxed">
            Our architectural consultants and project managers are available to assist you with any design adjustments, milestone updates, or inquiries.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-semibold text-[#586348]">
            <a
              href="tel:+8801700000000"
              className="px-4 py-2 bg-[#F7F4EE] border border-[#DED5C7] rounded-xl hover:bg-[#EBE4D8] transition"
            >
              Call Us Directly
            </a>
            <a
              href="mailto:info@banglasketch.com"
              className="px-4 py-2 bg-[#586348] text-white rounded-xl hover:bg-[#444D37] transition"
            >
              Email Project Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
