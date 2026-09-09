export interface ProposalDocument {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface ProposalVersion {
  id: number;
  proposal_id: number;
  version: number;
  scope_summary: string;
  proposed_cost: number | string;
  timeline_days?: number;
  documents: ProposalDocument[];
  created_at: string;
}

export interface Proposal {
  id: number;
  project_id: number;
  title: string;
  status: "draft" | "sent" | "approved" | "rejected" | "superseded" | string;
  approved_version?: number;
  approved_at?: string;
  approval_notes?: string;
  versions: ProposalVersion[];
}

export interface ChangeOrder {
  id: number;
  project_id: number;
  title: string;
  description: string;
  proposed_cost: number | string;
  timeline_impact_days: number;
  status: "pending_approval" | "approved" | "rejected" | string;
  client_notes?: string;
  decided_at?: string;
  requested_by_name?: string;
  created_at: string;
}
