# Banglasketch (বাংলা স্কেচ) — Project Structure & Architecture Guide

This guide gives developers a clean, comprehensive overview of the repository structure, code conventions, data flows, and where every feature lives.

---

## 1. High-Level Architecture

The project is structured as a decoupled full-stack TypeScript/JavaScript application:

```
banglasketch/
├── frontend/             # Next.js 15 App Router (SSR/SSG, React 19, Tailwind)
├── backend/              # Node.js + Express 4 + PostgreSQL (REST API, Auth, CMS)
├── STRUCTURE.md          # Architecture & directory documentation (this file)
└── README.md             # Setup, installation, and running instructions
```

- **Frontend Port**: `3000` (Next.js dev & production server)
- **Backend Port**: `5000` (Express REST API)
- **Database**: PostgreSQL (Supabase pooler / local PostgreSQL)
- **Media Hosting**: Cloudinary (with automatic URL-level WebP/AVIF format and compression)

---

## 2. Frontend Directory Structure (`/frontend`)

```
frontend/
├── app/                              # Next.js 15 App Router pages and API routes
│   ├── layout.tsx                    # Root layout (Navbar, Footer, Providers, SEO)
│   ├── page.tsx                      # Homepage (Hero, Services, Before/After, Gallery)
│   ├── not-found.tsx                 # Custom 404 page with home navigation
│   ├── error.tsx                     # Global error boundary & recovery page
│   ├── sitemap.ts                    # Dynamic XML sitemap generator
│   ├── robots.ts                     # Search engine crawler rules
│   │
│   ├── about/page.tsx                # Studio story, team, and philosophy
│   ├── services/                     # Services overview and category details
│   │   ├── page.tsx                  # Services list
│   │   └── [category]/page.tsx       # Dynamic service page (Kitchen, Bedroom, etc.)
│   ├── portfolio/                    # Showcase portfolio
│   │   ├── page.tsx                  # Filterable project gallery (Kitchen, Bedroom, etc.)
│   │   └── [slug]/page.tsx           # Single project showcase with gallery & testimonial
│   ├── blog/                         # Studio Journal / Articles
│   │   ├── page.tsx                  # Filterable articles by category
│   │   └── [slug]/page.tsx           # Article detail with Markdown renderer
│   ├── contact/page.tsx              # Contact form, office location, map, WhatsApp
│   ├── privacy/page.tsx              # Privacy policy
│   ├── terms/page.tsx                # Terms of service
│   │
│   ├── admin/                        # Administrative CMS (Protected routes)
│   │   ├── layout.tsx                # Admin shell, sidebar, and session guard
│   │   ├── page.tsx                  # Admin dashboard & key statistics
│   │   ├── login/page.tsx            # Admin authentication form
│   │   ├── projects/                 # Project CMS (List, Create, Edit)
│   │   ├── blog/                     # Blog CMS (List, Create, Edit with Markdown)
│   │   ├── videos/                   # Video Showcase CMS
│   │   ├── testimonials/             # Client Testimonials CMS
│   │   ├── contacts/                 # Contact inquiries & lead management
│   │   └── settings/                 # Global website & Maintenance mode settings
│   │
│   └── api/                          # Next.js Server-Side API Handlers (BFF layer)
│       ├── admin/                    # Admin auth proxy (login, logout, session)
│       ├── contact/route.ts          # Public contact form submission
│       ├── newsletter/route.ts       # Newsletter subscriber handler
│       └── maintenance/route.ts      # Live maintenance status endpoint
│
├── components/                       # Reusable React UI Components
│   ├── Layout.tsx                    # Shared page header and navigation
│   ├── Footer.tsx                    # Global footer with links, contact, and legal
│   ├── ProjectCard.tsx               # Portfolio project card with Cloudinary optimization
│   ├── BlogCard.tsx                  # Journal article card
│   ├── TestimonialCard.tsx           # Client review card with star ratings
│   ├── BeforeAfterSlider.tsx         # Interactive touch/keyboard comparison slider
│   ├── ContactForm.tsx               # Client-side contact inquiry form
│   ├── NewsletterForm.tsx            # Newsletter subscription form
│   ├── MaintenancePopup.tsx          # Configurable maintenance mode banner/modal
│   ├── MarkdownContent.tsx           # Sanitized Markdown renderer for blog posts
│   ├── AnimateOnScroll.tsx           # Viewport entry animation wrappers
│   ├── ServiceIcons.tsx              # SVG icons for architectural categories
│   └── admin/                        # Admin-exclusive CMS UI components
│       ├── CloudinaryUpload.tsx      # Drag-and-drop image uploader
│       └── RichTextEditor.tsx        # Markdown editor for blog articles
│
├── lib/                              # Utility functions, API clients, and constants
│   ├── api.ts                        # Data fetching layer connecting to Express backend
│   ├── admin-auth.ts                 # Next.js server-side cookie authentication guards
│   ├── cloudinary.ts                 # Cloudinary transformation & compression pipeline
│   ├── constants.ts                  # Brand info, navigation links, and categories
│   └── maintenance.ts                # Maintenance mode resolution logic
│
├── middleware.ts                     # Edge middleware protecting `/admin/*` routes
├── next.config.js                    # Next.js config (Cloudinary remote image domains)
├── tailwind.config.js                # Custom gold (`#c5a059`) & navy (`#0a2540`) theme
└── tsconfig.json                     # TypeScript strict configuration
```

---

## 3. Backend Directory Structure (`/backend`)

```
backend/
├── server.js                         # Express entry point (Middleware, CORS, Routes, Rate Limits)
├── db.js                             # PostgreSQL connection pooler (IPv4/IPv6 safe)
│
├── config/
│   └── db.js                         # Database credentials and SSL configuration
│
├── routes/                           # API route definitions
│   ├── admin.js                      # Authenticated admin endpoints (verify, stats, settings)
│   ├── projects.js                   # Project endpoints (GET public, POST/PUT/DELETE admin)
│   ├── blog.js                       # Blog post endpoints (GET public, POST/PUT/DELETE admin)
│   ├── testimonials.js               # Client testimonial endpoints
│   ├── videos.js                     # Video showcase endpoints
│   ├── contact.js                    # Lead capture and message retrieval
│   └── newsletter.js                 # Newsletter subscription handling
│
├── controllers/                      # Business logic controllers
│   ├── projectController.js          # Project database query handlers
│   └── blogController.js             # Blog database query handlers
│
├── models/                           # Data models / Schema representations
│   ├── Project.js                    # Project entity
│   ├── BlogPost.js                   # Blog post entity
│   ├── Testimonial.js                # Testimonial entity
│   └── Contact.js                    # Contact message entity
│
├── middleware/                       # Express middlewares
│   └── (verifyAdmin, etc.)           # JWT authentication and role verification
│
├── services/                         # External services
│   ├── email.js                      # Nodemailer / SMTP email dispatcher
│   └── cloudinary.js                 # Cloudinary media signature generator
│
└── scripts/                          # Database migration and seeding tools
    ├── seed_20_projects.js           # Seeds 20 complete showcase projects across all categories
    ├── seed.js                       # Full database seed (projects, blogs, testimonials)
    └── migrate.js                    # Database migration runner (applies migrations/*.sql)
```

---

## 4. Key Data Models & Database Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `projects` | Portfolio showcases | `title`, `slug`, `category`, `featured_image`, `gallery`, `date_completed`, `client_testimonial` |
| `blog_posts` | Studio journal articles | `title`, `slug`, `excerpt`, `content` (Markdown), `category`, `featured_image`, `published_date` |
| `testimonials` | Client reviews | `client_name`, `client_location`, `quote`, `rating`, `client_image` |
| `contacts` | Client inquiries & leads | `name`, `email`, `phone`, `service`, `message`, `status`, `created_at` |
| `newsletter_subscribers`| Email newsletter list | `email`, `subscribed_at` |
| `site_settings` | Dynamic CMS settings | `key`, `value` (JSONB for maintenance, contact details, social links) |

---

## 5. Security & Authentication Flow

1. **Admin Login**:
   - `POST /api/admin/login` on the Next.js server receives admin credentials.
   - It verifies the password with the Express backend (`POST /api/admin/login`).
   - On success, Next.js sets a secure `httpOnly`, `sameSite: strict` session cookie (`banglasketch_admin_session`).
   - No JWT or token is ever stored in `localStorage` or `sessionStorage`.

2. **Route Protection**:
   - `frontend/middleware.ts` runs at the edge and checks for the session cookie before allowing access to any `/admin/*` route (except `/admin/login`).
   - `backend/routes/admin.js` protects all mutation endpoints via `verifyAdmin` JWT validation.

3. **Media Security**:
   - Images are uploaded via signed endpoints or configured upload presets directly to Cloudinary.
   - Display URLs are automatically passed through `frontend/lib/cloudinary.ts` to attach automatic format negotiation (`f_auto`) and quality compression (`q_auto:good`).

---

## 6. Development Guidelines for Engineers

1. **Adding a New Page**:
   - Create the route inside `frontend/app/<route-name>/page.tsx`.
   - Export a `metadata: Metadata` object for SEO.
   - Use `AnimateOnScroll` or standard Tailwind classes matching the `#0a2540` (navy) and `#c5a059` (gold) palette.

2. **Adding an API Endpoint**:
   - Define the route in `backend/routes/<entity>.js`.
   - Protect write operations (`POST`, `PUT`, `DELETE`) with the `verifyAdmin` middleware.
   - Add the corresponding fetch method in `frontend/lib/api.ts`.

3. **Running the Applications**:
   - **Frontend**: `cd frontend && npm run dev`
   - **Backend**: `cd backend && npm run dev`
   - **Build Verification**: `cd frontend && npm run build`
