# Bangla Sketch — cPanel Complete Deployment Guide

This step-by-step guide explains how to host the **Bangla Sketch** platform (Next.js 15 Frontend + Node.js Express Backend) on **cPanel with Node.js Selector (CloudLinux / Phusion Passenger)**.

---

## 📋 Architecture on cPanel

* **Frontend:** Next.js 15 App Router (`frontend/`) — starts via `server.js` on your main domain (`yourdomain.com`).
* **Backend:** Node.js Express API (`backend/`) — starts via `server.js` on your API subdomain (`api.yourdomain.com`) or subpath.
* **Database:** PostgreSQL on Supabase (configured in `backend/.env`).
* **Image Media:** Cloudinary (already integrated and configured).
* **Email / Notifications:** Gmail SMTP App Password (already configured in `backend/.env`).

---

## 🚀 Step 1: Upload and Extract the ZIP in cPanel

1. Log in to your **cPanel**.
2. Open **File Manager**.
3. Create a folder in your home directory (e.g. `/home/yourusername/banglasketch`), or upload to your desired directory.
4. Click **Upload** and select `banglasketch-hosting.zip`.
5. Once uploaded, right-click `banglasketch-hosting.zip` and click **Extract**.
6. You will see:
   * `backend/`
   * `frontend/` (includes the pre-compiled `.next` production build!)
   * `cpanel.htaccess.example`
   * `ecosystem.config.js`
   * `docs/`

---

## ⚙️ Step 2: Configure Environment Variables

### A. Backend Environment (`backend/.env`)
The ZIP includes your active `backend/.env`. Verify or update the following values in `backend/.env`:

```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=postgresql://postgres.kbboeqltxhlqjwnhlxbn:PZ5ponseSEN4c77u@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
CLOUDINARY_CLOUD_NAME=sm0xomj7
CLOUDINARY_API_KEY=725716647278416
CLOUDINARY_API_SECRET=UykVCqG_rPbXet2t-phzvooRK1w
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=arifulhaquerohan@gmail.com
SMTP_PASS=mfecvjjfaipwsdga
CONTACT_EMAIL=info@banglasketch.com
ADMIN_JWT_SECRET=5b1541ce0db15ed6260bb64b04e44c7ffc5cb315dff9b94b0343b52ab23a1492247cd1cb96df406cd0f04d638ea14f9d2f71f062057429c2ef2986ebbe6784fd
ADMIN_PASSWORD_HASH=$2a$12$aozSRAx..8cj.sLUNqHekOZOxxJO8CzpbeyKoB2XIQLaDeOY/3CjS
ADMIN_RECOVERY_EMAIL=arifulhaquerohan@gmail.com
ADMIN_NOTIFICATION_EMAIL=arifulhaquerohan@gmail.com
```

### B. Frontend Environment (`frontend/.env.local` or `frontend/.env.production`)
Create or edit `frontend/.env.local`:

```env
API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=sm0xomj7
```
*(Replace `yourdomain.com` with your actual live domain).*

---

## 🌐 Step 3: Set Up Domains & Subdomains

In cPanel **Domains / Subdomains**:
1. Main domain: `yourdomain.com` (for Frontend).
2. Create subdomain: `api.yourdomain.com` (for Backend API).
3. Ensure SSL certificates (Let's Encrypt / cPanel AutoSSL) are active for both domains.

---

## 🔧 Step 4: Create the Backend Node.js App

1. In cPanel, find and open **Setup Node.js App** (under the *Software* category).
2. Click **Create Application**.
3. Fill in the fields:
   * **Node.js version:** Select `20.x` or `22.x` (or the highest version available).
   * **Application mode:** `Production`
   * **Application root:** `banglasketch/backend` (path to backend folder).
   * **Application URL:** `api.yourdomain.com`
   * **Application startup file:** `server.js`
4. Click **Create** (top right).
5. Once created, click the **Run NPM Install** button in the cPanel Node.js interface.
6. Click **Restart Application** or **Run JS script** to start the backend.
7. Test it by visiting: `https://api.yourdomain.com/health` or `https://api.yourdomain.com/api/v1/enquiries` in your browser. You should see a JSON response.

---

## 💻 Step 5: Create the Frontend Next.js App

1. In **Setup Node.js App**, click **Create Application**.
2. Fill in the fields:
   * **Node.js version:** Select `20.x` or `22.x` (matching the backend).
   * **Application mode:** `Production`
   * **Application root:** `banglasketch/frontend` (path to frontend folder).
   * **Application URL:** `yourdomain.com` (your main domain).
   * **Application startup file:** `server.js`
3. Click **Create**.
4. Click **Run NPM Install**.
   * *Note: The pre-built `.next` production build is already included in this ZIP! You do NOT need to run `npm run build` on cPanel, which prevents out-of-memory errors on shared hosting.*
5. Click **Restart Application**.
6. Visit `https://yourdomain.com` in your browser!

---

## 🔍 Step 6: Verify Admin Panel & Features

1. Open `https://yourdomain.com/admin/login`.
2. Enter your credentials.
3. Test the **Forgot Password** link:
   * Enter your admin recovery email (`arifulhaquerohan@gmail.com`).
   * Check your email for the 6-digit luxury branded verification code.
   * Enter the code and set a new password.
4. Test the **Enquiry Intake Form** on the homepage or `/contact` to verify email dispatch and database persistence.

---

## ❓ Troubleshooting Tips for cPanel

* **503 Service Unavailable / Passenger Error**:
  * Check the logs inside cPanel Node.js App (or look in `stderr.log` inside the app folder).
  * Ensure `server.js` is set as the **Application startup file**.
  * Ensure `npm install` was run inside the app root.
* **CORS Errors**:
  * Ensure `FRONTEND_URL=https://yourdomain.com` in `backend/.env` matches your exact frontend URL without trailing slashes.
* **Need to rebuild frontend?**
  * If you have SSH access: `cd banglasketch/frontend && npm run build`
  * If SSH is not enabled, build locally on your computer with `npm run build` and upload the `.next/` directory.
