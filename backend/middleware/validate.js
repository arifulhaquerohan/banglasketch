const { z } = require('zod');

const optionalUrl = z.union([z.literal(''), z.string().url().max(2048)]).optional().nullable();
const slug = z.string().trim().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const common = {
  title: z.string().trim().min(1).max(255),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
};
const schemas = {
  projects: z.object({ ...common, slug, description: z.string().max(50000).optional().nullable(), category: z.enum(['kitchen','bedroom','living-room','bathroom','commercial','other']), featured_image: optionalUrl, gallery: z.array(z.string().url().max(2048)).max(30).optional(), before_image: optionalUrl, after_image: optionalUrl, client_name: z.string().max(255).optional().nullable(), client_testimonial: z.string().max(10000).optional().nullable(), date_completed: z.string().date().optional().nullable(), cloudinary_ids: z.array(z.string().max(255)).max(50).optional() }).strict(),
  blog_posts: z.object({ ...common, slug, excerpt: z.string().max(5000).optional().nullable(), content: z.string().max(250000).optional().nullable(), featured_image: optionalUrl, category: z.string().trim().min(1).max(100).optional().nullable(), meta_description: z.string().max(500).optional().nullable(), tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(), author: z.string().trim().min(1).max(255).optional(), published_date: z.string().datetime({ offset: true }).optional().nullable(), scheduled_publish_date: z.string().datetime({ offset: true }).optional().nullable(), reading_time: z.number().int().min(1).max(1440).optional(), cloudinary_id: z.string().max(255).optional().nullable() }).strict(),
  videos: z.object({ ...common, youtube_url: z.string().url().max(2048), description: z.string().max(10000).optional().nullable(), thumbnail: optionalUrl, duration: z.string().max(20).optional().nullable(), display_order: z.number().int().min(0).max(100000).optional() }).strict(),
  testimonials: z.object({ client_name: z.string().trim().min(1).max(255), client_location: z.string().max(255).optional().nullable(), quote: z.string().trim().min(1).max(10000), rating: z.number().int().min(1).max(5).optional(), client_image: optionalUrl, project_id: z.number().int().positive().optional().nullable(), cloudinary_id: z.string().max(255).optional().nullable(), featured: z.boolean().optional() }).strict(),
  enquiry_create: z.object({
    name: z.string().trim().min(1).max(255),
    phone: z.string().trim().min(6).max(50),
    email: z.string().trim().email().max(255).optional().nullable().or(z.literal('')),
    project_location: z.string().trim().min(1).max(255),
    property_type: z.enum(['apartment', 'house', 'office', 'commercial_space', 'other']),
    service_scope: z.enum(['interior_design', 'renovation', 'both']),
    approx_budget: z.string().trim().max(100).optional().nullable(),
    preferred_start_date: z.string().trim().max(100).optional().nullable(),
    notes: z.string().trim().max(10000).optional().nullable(),
    attachments: z.array(z.string().url().max(2048)).max(20).optional(),
    website: z.string().optional(),
    started_at: z.union([z.number(), z.string()]).optional(),
  }),
  enquiry_update: z.object({
    status: z.enum(['new_enquiry', 'contacted', 'consultation', 'site_visit', 'proposal_sent', 'approved', 'active_project', 'handover', 'on_hold', 'closed']).optional(),
    status_reason: z.string().trim().max(1000).optional().nullable(),
    assigned_to: z.number().int().positive().optional().nullable(),
    next_action: z.string().trim().max(500).optional().nullable(),
    next_follow_up_date: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).or(z.literal('')).nullable(),
    notes: z.string().trim().max(10000).optional().nullable(),
  }),
  follow_up_create: z.object({
    channel: z.enum(['call', 'whatsapp', 'meeting', 'site_visit', 'email', 'note']),
    summary: z.string().trim().min(1).max(5000),
    next_action: z.string().trim().max(500).optional().nullable(),
    scheduled_at: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).or(z.literal('')).nullable(),
  }),
  proposal_create: z.object({
    title: z.string().trim().min(1).max(255),
    scope_summary: z.string().trim().min(1).max(20000),
    proposed_cost: z.number().nonnegative(),
    timeline_days: z.number().int().positive().optional().nullable(),
    documents: z.array(z.object({
      name: z.string().trim().min(1).max(255),
      url: z.string().url().max(2048),
      type: z.string().max(100).optional(),
      size: z.number().nonnegative().optional(),
    })).max(30).optional(),
  }),
  proposal_version_create: z.object({
    scope_summary: z.string().trim().min(1).max(20000),
    proposed_cost: z.number().nonnegative(),
    timeline_days: z.number().int().positive().optional().nullable(),
    documents: z.array(z.object({
      name: z.string().trim().min(1).max(255),
      url: z.string().url().max(2048),
      type: z.string().max(100).optional(),
      size: z.number().nonnegative().optional(),
    })).max(30).optional(),
  }),
  proposal_approve: z.object({
    version: z.number().int().positive().optional(),
    approval_notes: z.string().trim().max(2000).optional().nullable(),
  }),
  client_project_update: z.object({
    stage: z.enum([
      'consultation',
      'concept_design',
      'schematic_design',
      'design_development',
      'approved',
      'active_project',
      'procurement',
      'construction',
      'handover',
      'completed',
      'on_hold',
      'cancelled',
    ]).optional(),
    current_milestone: z.string().trim().max(255).optional().nullable(),
    next_milestone: z.string().trim().max(255).optional().nullable(),
    project_manager_id: z.number().int().positive().optional().nullable(),
    agreed_scope: z.string().trim().max(20000).optional().nullable(),
    agreed_budget: z.number().nonnegative().optional(),
    target_completion_date: z.string().date().optional().nullable().or(z.literal('')).nullable(),
  }),
  convert_to_project: z.object({
    title: z.string().trim().max(255).optional(),
    agreed_scope: z.string().trim().max(20000).optional(),
    agreed_budget: z.number().nonnegative().optional(),
    project_manager_id: z.number().int().positive().optional().nullable(),
  }),
  change_order_create: z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(10000),
    proposed_cost: z.number().nonnegative(),
    timeline_impact_days: z.number().int().min(0),
  }),
  change_order_decision: z.object({
    status: z.enum(['approved', 'rejected']),
    client_notes: z.string().trim().max(2000).optional().nullable(),
  }),
};

function validate(schema, partial = false) {
  return (req, res, next) => {
    const result = (partial ? schema.partial() : schema).safeParse(req.body);
    if (!result.success) return res.status(400).json({ success: false, error: 'Validation failed', details: result.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) });
    req.body = result.data;
    next();
  };
}
module.exports = { z, schemas, validate };

