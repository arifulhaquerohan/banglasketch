# Bangla Sketch (বাংলা স্কেচ) — Interior Design Platform

Official production web application and Content Management System for **Bangla Sketch**, Dhaka's premier luxury interior design studio.

## Architecture

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Next/Image, Next/Link.
- **Backend:** Node.js, Express 4, PostgreSQL (`pg`), Helmet, Express Rate Limit, JWT, Bcrypt.
- **Media:** Cloudinary with automatic WebP/AVIF compression pipeline.
- **Directory Structure:** See [STRUCTURE.md](docs/STRUCTURE.md) for full project layout and developer architecture guide.
- **Security:**
  - Next.js Edge Middleware route guards on `/admin/*`.
  - Server-verified `httpOnly`, `sameSite: strict`, `secure` session cookies.
  - Zero exposure of bearer tokens or administrative secrets in client bundles or storage.
  - Strict SQL parameterization and schema allowlists on dynamic filters.
  - Rate limiting on public lead capture endpoints.

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database instance

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

#### Seeding Database

To initialize database tables with sample projects, blogs, videos, testimonials, and settings:

```bash
cd backend
node scripts/seed.js
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the public site and [http://localhost:3000/admin](http://localhost:3000/admin) for the administrative CMS.

---

## Production Build & Deployment

### Build Frontend
```bash
cd frontend
npm run build
npm run start
```

### Run Backend in Production
```bash
cd backend
npm start
```

---

## Features & Highlights

1. **Full CMS Functionality:**
   - Manage Projects, Blog Posts (with rich markdown parsing), Videos, Testimonials, Contact Submissions, and Global Settings.
2. **Maintenance Mode:**
   - Multi-mode configurable maintenance system (modal dialog, top banner, or fullscreen takeover) with emergency WhatsApp and phone links.
3. **Durable Lead Capture:**
   - Submissions to contact and newsletter endpoints are safely stored in PostgreSQL; email notifications are dispatched asynchronously without blocking or dropping user requests.
4. **SEO & Discoverability:**
   - Dynamic XML sitemaps (`/sitemap.xml`) reflecting published projects and posts.
   - Search engine crawling directives (`/robots.txt`).
   - JSON-LD LocalBusiness / InteriorDesignService structured schemas.
5. **Accessibility:**
   - WCAG-compliant skip links.
   - Slider controls with full ARIA semantics and keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
   - Accessible modal focus trapping and `Escape` key handlers.
   - High-contrast visual focus indicators and `prefers-reduced-motion` support.

See [backend security and scaling deployment notes](docs/BACKEND_HARDENING.md) before deploying an existing installation.
