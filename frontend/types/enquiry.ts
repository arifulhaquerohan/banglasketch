export type PipelineStage =
  | "new_enquiry"
  | "contacted"
  | "consultation"
  | "site_visit"
  | "proposal_sent"
  | "approved"
  | "active_project"
  | "handover"
  | "on_hold"
  | "closed";

export type FollowUpChannel = "call" | "whatsapp" | "meeting" | "site_visit" | "note";

export interface FollowUp {
  id: number;
  channel: FollowUpChannel | string;
  summary: string;
  next_action?: string;
  scheduled_at?: string;
  created_at: string;
  actor_name?: string;
}

export interface EnquiryDetail {
  id: number;
  client_id?: number;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_alt_phone?: string;
  client_notes?: string;
  portal_token?: string;
  name: string;
  phone: string;
  email?: string;
  project_location: string;
  property_type: string;
  service_scope: string;
  approx_budget?: string;
  preferred_start_date?: string;
  notes?: string;
  attachments?: string[];
  status: PipelineStage | string;
  status_reason?: string;
  assigned_to?: number;
  assigned_name?: string;
  next_action?: string;
  next_follow_up_date?: string;
  created_at: string;
  is_overdue?: boolean;
}
