"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiBriefcase,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";
import { adminFetch } from "@/lib/api";
import type { ClientProject } from "@/types";

export default function ClientProjectsListPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<ClientProject[]>("client-projects");
    if (res.success && Array.isArray(res.data)) {
      setProjects(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#242824]">
            Active Client Projects
          </h1>
          <p className="text-xs md:text-sm text-[#5A625A] mt-1">
            Track project milestones, versioned proposal signoffs, and scope change orders.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-[#788278]">Loading client projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl">
          <FiBriefcase className="mx-auto text-[#788278] mb-3" size={32} />
          <h3 className="font-serif text-lg font-bold text-[#242824]">No active projects yet</h3>
          <p className="text-xs text-[#5A625A] max-w-md mx-auto mt-1">
            When a client approves a proposal in the Pipeline, promote their enquiry to create an active project.
          </p>
          <Link
            href="/admin/enquiries"
            className="mt-4 inline-block px-4 py-2 bg-[#586348] text-white rounded-xl text-xs font-semibold hover:bg-[#444D37]"
          >
            View Client Pipeline
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-5 flex flex-col justify-between hover:border-[#586348] transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#586348]/15 text-[#586348] border border-[#D5DEC4]">
                    {project.stage.replace(/_/g, " ")}
                  </span>
                  {(project.pending_change_orders_count ?? 0) > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <FiAlertCircle size={11} /> {project.pending_change_orders_count} Changes Pending
                    </span>
                  )}
                </div>

                <Link
                  href={`/admin/client-projects/${project.id}`}
                  className="font-serif text-lg font-bold text-[#242824] hover:text-[#586348] transition-colors block line-clamp-1"
                >
                  {project.title}
                </Link>

                <p className="text-xs text-[#5A625A] mt-1 font-medium">
                  Client: {project.client_name} ({project.client_phone})
                </p>

                {/* Milestone preview */}
                <div className="mt-4 pt-3 border-t border-[#EBE4D8] space-y-1.5 text-xs">
                  <div>
                    <span className="text-[11px] text-[#788278] block">Current Milestone:</span>
                    <span className="font-semibold text-[#242824]">
                      {project.current_milestone || "Concept & Planning"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#788278] block">Next Milestone:</span>
                    <span className="text-[#5A625A]">
                      {project.next_milestone || "Detailed Architectural Drawing"}
                    </span>
                  </div>
                </div>

                {/* Agreed baseline budget */}
                <div className="mt-4 p-3 bg-white border border-[#EBE4D8] rounded-xl flex items-center justify-between">
                  <span className="text-[11px] text-[#788278] font-medium">Agreed Budget:</span>
                  <span className="text-sm font-bold text-[#242824]">
                    BDT {Number(project.agreed_budget).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#EBE4D8] flex items-center justify-between">
                <span className="text-[11px] text-[#788278]">
                  PM: {project.project_manager_name || "Unassigned"}
                </span>
                <Link
                  href={`/admin/client-projects/${project.id}`}
                  className="px-3 py-1.5 bg-[#586348] text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-[#444D37]"
                >
                  <span>Manage</span>
                  <FiArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
