export interface ClientProject {
  id: number;
  client_id: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  title: string;
  stage: string;
  current_milestone?: string;
  next_milestone?: string;
  project_manager_id?: number;
  project_manager_name?: string;
  agreed_scope?: string;
  agreed_budget: number | string;
  target_completion_date?: string;
  portal_token?: string;
  pending_change_orders_count?: number | undefined;
  created_at: string;
}

export interface PortfolioProject {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  featured: boolean;
  featured_image: string;
  gallery: string[];
  before_image?: string;
  after_image?: string;
  client_name?: string;
  client_testimonial?: string;
  date_completed?: string;
  created_at: string;
}
