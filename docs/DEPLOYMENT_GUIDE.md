# Bangla Sketch (বাংলা স্ক্চ) — Production Deployment & Hosting Guide

Read [BACKEND_HARDENING.md](BACKEND_HARDENING.md) for authentication migration, TLS, proxy trust, and scaling requirements. The existing hosting ZIP is not updated by source changes; package the current source before uploading.

This guide explains step-by-step how to host the **Bangla Sketch** website and CMS on your production server.

---

## Architecture Overview

* **Frontend:** Next.js 15 (React 19, Tailwind CSS) — runs on port `3000`
* **Backend:** Node.js Express 4 API — runs on port `5000`
* **Database:** PostgreSQL (Supabase or self-hosted)
* **Storage:** Cloudinary (for images & media)
* **Email:** Nodemailer SMTP (Gmail or custom domain SMTP)

---

## Option 1: VPS Hosting (Ubuntu / Debian) — *Recommended*

This is the standard and most reliable method for hosting full-stack Next.js + Node.js applications.

### 1. Server Prerequisites
Connect to your VPS via SSH and install Node.js 22+, npm, git, and PM2:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs unzip nginx certbot python3-certbot-nginx

# Install PM2 process manager globally
sudo npm install -g pm2
```

### 2. Upload & Extract the Project
Upload `banglasketch-hosting.zip` to `/var/www/banglasketch` (or your home directory):

```bash
sudo mkdir -p /var/www/banglasketch
sudo chown -R $USER:$USER /var/www/banglasketch
cd /var/www/banglasketch

# Unzip
unzip banglasketch-hosting.zip
```

### 3. Configure Environment Variables

#### A. Backend (`backend/.env`):
Ensure `backend/.env` exists and contains your production values:
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:password@host:5432/database
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CONTACT_EMAIL=info@banglasketch.com
ADMIN_JWT_SECRET=your_long_random_jwt_secret
ADMIN_PASSWORD_HASH=your_bcrypt_hash
ADMIN_RECOVERY_EMAIL=your_email@gmail.com
ADMIN_NOTIFICATION_EMAIL=your_email@gmail.com
```

#### B. Frontend (`frontend/.env.local`):
```env
API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
TRUST_INGRESS_IP=true
```
*(Note: If hosting backend on the same server behind the subdomain `api.yourdomain.com`, `NEXT_PUBLIC_API_URL` should point to `https://api.yourdomain.com`).*

### 4. Install Dependencies and Build

```bash
# From the root directory:
npm run install:all

# Build Next.js frontend for production:
npm run build
```

### 5. Start with PM2
Launch both frontend and backend as persistent background services:

```bash
# Start both apps using the ecosystem configuration
pm2 start ecosystem.config.js

# Save process list so it restarts automatically on server reboot
pm2 save
pm2 startup
```

Useful PM2 commands:
* `pm2 status` — Check service status
* `pm2 logs` — View live console logs
* `pm2 restart all` — Restart all services

### 6. Configure Nginx Reverse Proxy & Free SSL

Copy the provided Nginx configuration:
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/banglasketch
```
Edit `/etc/nginx/sites-available/banglasketch` with your actual domain names (`yourdomain.com` and `api.yourdomain.com`), then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/banglasketch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Install free Let's Encrypt SSL certificates:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## Option 2: Cloud Hosting (Vercel + Render / Railway)

### 1. Deploy Frontend to Vercel
1. Upload the `frontend/` folder to GitHub or import via Vercel CLI.
2. In Vercel Project Settings, set Root Directory to `frontend`.
3. Add Environment Variables:
   * `API_URL` = URL of your deployed backend (e.g. `https://banglasketch-api.onrender.com`)
   * `NEXT_PUBLIC_API_URL` = URL of your deployed backend
   * Configure trusted client IP forwarding for your hosting provider; see `BACKEND_HARDENING.md`.
4. Click **Deploy**.

### 2. Deploy Backend to Render / Railway
1. Create a Web Service pointing to `backend/`.
2. Build Command: `npm install`
3. Start Command: `node server.js`
4. Add Environment Variables matching `backend/.env.example`.

---

## Option 3: cPanel (Shared Hosting with Node.js Selector)

1. Log into your cPanel and locate **Setup Node.js App**.
2. **Create Backend App**:
   * Node.js Version: `22.x` or latest available
   * Application Root: `backend`
   * Application URL: `api.yourdomain.com` or `yourdomain.com/api`
   * Application startup file: `server.js`
   * Add environment variables in the cPanel Node.js interface.
   * Click **Run NPM Install** and **Start Application**.
3. **Create Frontend App**:
   * Application Root: `frontend`
   * Application startup file: `node_modules/next/dist/bin/next`
   * Arguments: `start`
   * Run `npm install` and `npm run build`.

---

## Production Security Checklist

- [x] Admin Login Notification enabled (alerts sent to `arifulhaquerohan@gmail.com`).
- [x] Master password reset via OTP email verification configured.
- [x] Server-managed `httpOnly` secure cookies for sessions.
- [x] Rate limiting active on login and lead-capture endpoints.
- [x] Cloudinary automatic WebP/AVIF image delivery enabled.
