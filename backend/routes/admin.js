const { pagination } = require("../middleware/pagination");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_TOKEN_TTL = "8h";
const RECOVERY_EMAIL = (process.env.ADMIN_RECOVERY_EMAIL || "arifulhaquerohan@gmail.com").trim().toLowerCase();
const crypto = require("crypto");
const { authenticator } = require("otplib");
const { schemas, validate, z } = require("../middleware/validate");
const { audit, snapshot } = require("../services/audit");
const { enqueue } = require("../services/jobs");
const totpSecret = require("../services/totpSecret");

const { getCredentials, setPassword } = require("../services/adminCredentials");

const ADMIN_MUTATION_FIELDS = {
  projects: new Set([
    "title", "slug", "description", "category", "featured_image", "gallery",
    "before_image", "after_image", "client_name", "client_testimonial", "date_completed",
    "featured", "published", "cloudinary_ids",
  ]),
  blog_posts: new Set([
    "title", "slug", "excerpt", "content", "featured_image", "category", "meta_description",
    "tags", "author", "published_date", "scheduled_publish_date", "reading_time", "featured",
    "published", "cloudinary_id",
  ]),
  videos: new Set(["title", "youtube_url", "description", "thumbnail", "duration", "featured", "display_order", "published"]),
  testimonials: new Set(["client_name", "client_location", "quote", "rating", "client_image", "project_id", "cloudinary_id", "featured"]),
  contact_submissions: new Set(["name", "email", "phone", "service_type", "message", "read", "responded"]),
};

const ENTITY_TABLE_MAP = {
  projects: "projects",
  blog: "blog_posts",
  blog_posts: "blog_posts",
  videos: "videos",
  testimonials: "testimonials",
  contacts: "contact_submissions",
  contact_submissions: "contact_submissions",
};

const {
  sendPasswordResetOTP,
  sendAdminLoginNotification,
  sendPasswordResetSuccessNotification,
  maskEmail,
} = require("../services/email");

function getClientIp(req) {
  let ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1" || ip === "localhost") {
    return "127.0.0.1";
  }
  return ip.replace(/^::ffff:/, "");
}

function areIpsCompatible(ip1, ip2) {
  if (!ip1 || !ip2 || ip1 === "unknown" || ip2 === "unknown") return true;
  if (ip1 === ip2) return true;
  if (ip1 === "127.0.0.1" && ip2 === "127.0.0.1") return true;
  return false;
}

// Reject non-numeric :id params early with a 400 instead of a Postgres 500
router.param("id", (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ success: false, error: "Invalid id" });
  }
  next();
});

const { verifyAdmin, requireRole, roleRank } = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    if (!ADMIN_JWT_SECRET) {
      return res.status(500).json({ success: false, error: "Admin authentication is not configured" });
    }

    const { password, email, totp } = req.body || {};
    if (typeof password !== "string" || !password || Buffer.byteLength(password) > 72) return res.status(400).json({ success: false, error: "Password required" });

    const loginEmail = String(email || process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || '').trim().toLowerCase();
    const users = await pool.query('SELECT * FROM admin_users WHERE email=$1', [loginEmail]);
    const user = users.rows[0];
    let credentials = null;
    if (!user) {
      const activeUsers = await pool.query('SELECT COUNT(*)::int AS count FROM admin_users WHERE active=true');
      const hasActiveUsers = (activeUsers.rows[0]?.count || 0) > 0;
      if (hasActiveUsers) {
        await pool.query('INSERT INTO login_history(admin_user_id,email,success,ip_address,user_agent) VALUES($1,$2,$3,$4,$5)', [null, loginEmail || null, false, getClientIp(req), req.headers['user-agent'] || null]);
        return res.status(401).json({ success: false, error: "Wrong email or password" });
      }
      credentials = await getCredentials();
    }
    const stored = user?.password_hash || credentials?.password_hash;
    if (!stored) {
      return res.status(500).json({
        success: false,
        error: "Admin password not configured. Set ADMIN_PASSWORD_HASH in .env",
      });
    }

    const ok = Boolean(user?.active !== false) && await bcrypt.compare(password, stored);
    if (!ok) {
      await pool.query('INSERT INTO login_history(admin_user_id,email,success,ip_address,user_agent) VALUES($1,$2,$3,$4,$5)', [user?.id || null, loginEmail || null, false, getClientIp(req), req.headers['user-agent'] || null]);
      return res.status(401).json({ success: false, error: "Wrong email or password" });
    }
    if (user?.totp_enabled && (!totp || !authenticator.check(String(totp), totpSecret.decrypt(user.totp_secret)))) {
      await pool.query('INSERT INTO login_history(admin_user_id,email,success,ip_address,user_agent) VALUES($1,$2,$3,$4,$5)', [user?.id || null, loginEmail || null, false, getClientIp(req), req.headers['user-agent'] || null]);
      return res.status(401).json({ success: false, error: "A valid two-factor code is required", requiresTotp: true });
    }

    await pool.query('INSERT INTO login_history(admin_user_id,email,success,ip_address,user_agent) VALUES($1,$2,$3,$4,$5)', [user?.id || null, loginEmail || null, true, getClientIp(req), req.headers['user-agent'] || null]);

    const token = jwt.sign({ sub: user?.id, role: user?.role || "owner", version: (user ? user.token_version : credentials?.version) || 1 }, ADMIN_JWT_SECRET, { algorithm: "HS256", expiresIn: ADMIN_TOKEN_TTL });
    if (user) await pool.query('UPDATE admin_users SET last_login_at=NOW() WHERE id=$1', [user.id]);

    // Asynchronously dispatch admin login security notification without blocking response
    const clientIp = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "Unknown";
    const notifyEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || "arifulhaquerohan@gmail.com").trim().toLowerCase();

    sendAdminLoginNotification({
      to: notifyEmail,
      ip: clientIp,
      userAgent,
      timestamp: new Date(),
    }).catch((err) => {
      console.error("⚠ Failed to dispatch admin login notification:", err.message);
    });

    res.json({ success: true, token });
  } catch (err) {
    res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" });
  }
});

// GET all (admin dashboard)
router.get("/projects", verifyAdmin, async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const r = await pool.query(`SELECT * FROM projects WHERE deleted_at IS ${req.query.trash === 'true' ? 'NOT NULL' : 'NULL'} ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`, [limit + 1, offset]);
    res.json({ success: true, data: r.rows.slice(0, limit), pagination: { page, limit, hasMore: r.rows.length > limit } });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

router.get("/blog", verifyAdmin, async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const r = await pool.query(`SELECT * FROM blog_posts WHERE deleted_at IS ${req.query.trash === 'true' ? 'NOT NULL' : 'NULL'} ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`, [limit + 1, offset]);
    res.json({ success: true, data: r.rows.slice(0, limit), pagination: { page, limit, hasMore: r.rows.length > limit } });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

router.get("/contacts", verifyAdmin, async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const r = await pool.query(`SELECT * FROM contact_submissions WHERE deleted_at IS ${req.query.trash === 'true' ? 'NOT NULL' : 'NULL'} ORDER BY submitted_at DESC, id DESC LIMIT $1 OFFSET $2`, [limit + 1, offset]);
    res.json({ success: true, data: r.rows.slice(0, limit), pagination: { page, limit, hasMore: r.rows.length > limit } });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

router.get("/testimonials", verifyAdmin, async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const r = await pool.query(`SELECT * FROM testimonials WHERE deleted_at IS ${req.query.trash === 'true' ? 'NOT NULL' : 'NULL'} ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`, [limit + 1, offset]);
    res.json({ success: true, data: r.rows.slice(0, limit), pagination: { page, limit, hasMore: r.rows.length > limit } });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

router.get("/videos", verifyAdmin, async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const r = await pool.query(`SELECT * FROM videos WHERE deleted_at IS ${req.query.trash === 'true' ? 'NOT NULL' : 'NULL'} ORDER BY display_order ASC, created_at DESC, id DESC LIMIT $1 OFFSET $2`, [limit + 1, offset]);
    res.json({ success: true, data: r.rows.slice(0, limit), pagination: { page, limit, hasMore: r.rows.length > limit } });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

router.put("/contacts/:id", verifyAdmin, requireRole("editor"), async (req, res) => {
  try {
    const { read, responded } = req.body || {};
    const updates = [];
    const values = [];
    if (typeof read === "boolean") {
      values.push(read);
      updates.push(`read = $${values.length}`);
    }
    if (typeof responded === "boolean") {
      values.push(responded);
      updates.push(`responded = $${values.length}`);
    }
    if (!updates.length) {
      return res.status(400).json({ success: false, error: "No valid fields to update" });
    }
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE contact_submissions SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
    await audit(req, 'update', 'contact_submissions', req.params.id, null, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

router.delete("/contacts/:id", verifyAdmin, requireRole("editor"), async (req, res) => {
  try {
    const result = await pool.query("UPDATE contact_submissions SET deleted_at=NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
    await audit(req, 'soft_delete', 'contact_submissions', req.params.id, result.rows[0], null);
    res.json({ success: true });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const [p, b, v, t, c, n, recent] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total,
                         COUNT(*) FILTER (WHERE published)::int AS published,
                         COUNT(*) FILTER (WHERE featured)::int AS featured
                  FROM projects WHERE deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*)::int AS total,
                         COUNT(*) FILTER (WHERE published)::int AS published,
                         COUNT(*) FILTER (WHERE NOT published AND scheduled_publish_date > NOW())::int AS scheduled,
                         COALESCE(SUM(views_count), 0)::int AS views
                  FROM blog_posts WHERE deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE published)::int AS published FROM videos WHERE deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*)::int AS total, COALESCE(ROUND(AVG(rating), 1), 0)::float AS avg_rating FROM testimonials WHERE deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*)::int AS total,
                         COUNT(*) FILTER (WHERE NOT read)::int AS unread,
                         COUNT(*) FILTER (WHERE NOT responded)::int AS unresponded,
                         COUNT(*) FILTER (WHERE submitted_at > NOW() - INTERVAL '7 days')::int AS last_7_days
                  FROM contact_submissions WHERE deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*) FILTER (WHERE active)::int AS active FROM newsletter_subscribers`),
      pool.query(`SELECT id, name, email, service_type, read, responded, submitted_at
                  FROM contact_submissions WHERE deleted_at IS NULL ORDER BY submitted_at DESC LIMIT 5`),
    ]);

    res.json({
      success: true,
      data: {
        // Backwards-compatible flat fields
        projects: p.rows[0].total,
        blogPosts: b.rows[0].total,
        unreadContacts: c.rows[0].unread,
        testimonials: t.rows[0].total,
        // Detailed breakdown
        detail: {
          projects: p.rows[0],
          blog: b.rows[0],
          videos: v.rows[0],
          testimonials: t.rows[0],
          contacts: c.rows[0],
          subscribers: n.rows[0].active,
        },
        recentContacts: recent.rows,
      },
    });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

// Admin token verification endpoint
router.get("/verify", verifyAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// Settings
router.get("/settings", verifyAdmin, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM site_settings");
    const obj = {};
    r.rows.forEach((row) => { obj[row.key] = row.value; });
    res.json({ success: true, data: obj });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

router.put("/settings/:key", verifyAdmin, requireRole("admin"), async (req, res) => {
  try {
    const { key } = req.params;
    if (!/^[a-z0-9_.-]{1,100}$/i.test(key)) {
      return res.status(400).json({ success: false, error: "Invalid settings key" });
    }
    await pool.query(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(req.body)]
    );
    await audit(req, 'update_setting', 'site_settings', key, null, req.body);
    res.json({ success: true });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

function createAdminCrudRoutes(path, table) {
  const allowedFields = ADMIN_MUTATION_FIELDS[table];

  router.post(`/${path}`, verifyAdmin, requireRole("editor"), validate(schemas[table]), async (req, res) => {
    try {
      const fields = Object.keys(req.body || {}).filter((field) => allowedFields.has(field));
      if (!fields.length) {
        return res.status(400).json({ success: false, error: "No valid fields supplied" });
      }

      const values = fields.map((field) => ["gallery", "cloudinary_ids", "tags"].includes(field)
        ? JSON.stringify(req.body[field] || [])
        : req.body[field]);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");
      const client = await pool.connect();
      let result;
      try {
        await client.query('BEGIN');
        result = await client.query(`INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`, values);
        await snapshot(table, result.rows[0].id, result.rows[0], req.admin.sub, client);
        await audit(req, 'create', table, result.rows[0].id, null, result.rows[0], client);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
      return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      return res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" });
    }
  });

  router.put(`/${path}/:id`, verifyAdmin, requireRole("editor"), validate(schemas[table], true), async (req, res) => {
    try {
      const fields = Object.keys(req.body || {}).filter((field) => allowedFields.has(field));
      if (!fields.length) {
        return res.status(400).json({ success: false, error: "No valid fields supplied" });
      }

      const values = fields.map((field) => ["gallery", "cloudinary_ids", "tags"].includes(field)
        ? JSON.stringify(req.body[field] || [])
        : req.body[field]);
      const updates = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
      values.push(req.params.id);
      const client = await pool.connect();
      let result;
      try {
        await client.query('BEGIN');
        const previous = await client.query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`, [req.params.id]);
        result = await client.query(`UPDATE ${table} SET ${updates}${table !== "videos" && table !== "testimonials" ? ", updated_at = NOW()" : ""} WHERE id = $${values.length} AND deleted_at IS NULL RETURNING *`, values);
        if (result.rows[0]) {
          await snapshot(table, result.rows[0].id, result.rows[0], req.admin.sub, client);
          await audit(req, 'update', table, result.rows[0].id, previous.rows[0], result.rows[0], client);
        }
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
      if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
      return res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      return res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" });
    }
  });

  router.delete(`/${path}/:id`, verifyAdmin, requireRole("editor"), async (req, res) => {
    try {
      const result = await pool.query(`UPDATE ${table} SET deleted_at=NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *`, [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
      await snapshot(table, result.rows[0].id, result.rows[0], req.admin.sub);
      await audit(req, 'soft_delete', table, result.rows[0].id, result.rows[0], null);
      return res.json({ success: true });
    } catch (err) {
      return res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" });
    }
  });
}

createAdminCrudRoutes("projects", "projects");
createAdminCrudRoutes("blog", "blog_posts");
createAdminCrudRoutes("videos", "videos");
createAdminCrudRoutes("testimonials", "testimonials");

async function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

router.post("/change-password", verifyAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== "string" || Buffer.byteLength(currentPassword) > 72 || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Current password and new password are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) {
      return res.status(400).json({ success: false, error: "New password must be at least 8 characters" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, error: "New password must differ from current password" });
    }

    const userResult = req.admin.sub ? await pool.query('SELECT password_hash,token_version FROM admin_users WHERE id=$1', [req.admin.sub]) : null;
    const credentials = req.admin.sub ? null : await getCredentials();
    const stored = userResult?.rows[0]?.password_hash || credentials?.password_hash;
    if (!stored) {
      return res.status(500).json({ success: false, error: "Admin password not configured" });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, stored);
    if (!isCurrentValid) {
      return res.status(401).json({ success: false, error: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    if (req.admin.sub) {
      await pool.query(`WITH changed AS (UPDATE admin_users SET password_hash=$1,token_version=token_version+1,updated_at=NOW() WHERE id=$2 RETURNING id, email)
        UPDATE admin_password_resets SET used=true WHERE used=false AND email=(SELECT email FROM changed)`, [hash, req.admin.sub]);
    }
    else await setPassword(hash, pool, credentials.version);
    await audit(req, 'change_password', 'admin_users', req.admin.sub);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" });
  }
});

router.post("/request-reset-otp", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, error: "Please enter your administrator email address" });
    }

    const inputEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || "arifulhaquerohan@gmail.com").trim().toLowerCase();

    // Verify if the input email matches the registered administrator email
    if (inputEmail !== adminEmail) {
      return res.status(403).json({
        success: false,
        error: "The provided email address does not match our administrator records.",
      });
    }

    const targetEmail = adminEmail;
    const clientIp = getClientIp(req);

    const otp = await generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiryMinutes = 10;
    const client = await pool.connect();
    let resetId;
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM admin_credentials WHERE id = 1 FOR UPDATE');
      const recent = await client.query("SELECT id FROM admin_password_resets WHERE email = $1 AND created_at > NOW() - INTERVAL '60 seconds' LIMIT 1", [targetEmail]);
      if (recent.rowCount) {
        await client.query('ROLLBACK');
        return res.status(429).json({ success: false, error: "Please wait 60 seconds before requesting another code" });
      }
      await client.query('UPDATE admin_password_resets SET used = true WHERE email = $1 AND used = false', [targetEmail]);
      const inserted = await client.query("INSERT INTO admin_password_resets (email, otp_hash, expires_at, ip_address) VALUES ($1, $2, NOW() + INTERVAL '10 minutes', $3) RETURNING id", [targetEmail, otpHash, clientIp]);
      resetId = inserted.rows[0].id;
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }

    const emailResult = await sendPasswordResetOTP({ to: targetEmail, otp, expiresInMinutes: expiryMinutes });

    if (!emailResult.sent) {
      await pool.query('UPDATE admin_password_resets SET used = true WHERE id = $1', [resetId]);
      return res.status(503).json({ success: false, error: "Recovery email could not be sent. Please try again later." });
    }
    res.json({ success: true, sent: true, message: `A recovery code has been sent to ${maskEmail(targetEmail)}`, email: maskEmail(targetEmail) });
  } catch (err) {
    res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" });
  }
});

router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    const adminEmail = (process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || "arifulhaquerohan@gmail.com").trim().toLowerCase();
    const targetEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const verifyingIp = getClientIp(req);

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, error: "Administrator email is required" });
    }

    if (targetEmail !== adminEmail) {
      return res.status(403).json({ success: false, error: "The provided email address does not match our administrator records." });
    }

    if (!otp || !newPassword) {
      return res.status(400).json({ success: false, error: "OTP and new password are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) {
      return res.status(400).json({ success: false, error: "New password must be at least 8 characters" });
    }
    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ success: false, error: "OTP must be a 6-digit number" });
    }

    const record = await pool.query(
      `SELECT id, otp_hash, attempts, used, expires_at, ip_address
       FROM admin_password_resets
       WHERE email = $1 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [targetEmail]
    );

    if (!record.rows.length) {
      return res.status(400).json({ success: false, error: "Invalid or expired recovery code. Please request a new one." });
    }

    const row = record.rows[0];
    if (row.used) {
      return res.status(400).json({ success: false, error: "This recovery code has already been used." });
    }
    if (row.attempts >= 5) {
      await pool.query(`UPDATE admin_password_resets SET used = true WHERE id = $1`, [row.id]);
      return res.status(429).json({ success: false, error: "Too many failed attempts. This code has been invalidated." });
    }
    if (!areIpsCompatible(row.ip_address, verifyingIp)) {
      return res.status(403).json({ success: false, error: "Request origin mismatch. OTP codes may only be verified from the same device/session that requested them." });
    }

    const reserved = await pool.query('UPDATE admin_password_resets SET attempts = attempts + 1 WHERE id = $1 AND used = false AND attempts < 5 AND expires_at > NOW() RETURNING attempts', [row.id]);
    if (!reserved.rowCount) return res.status(400).json({ success: false, error: "Invalid or expired recovery code" });
    const isValid = await bcrypt.compare(String(otp).trim(), row.otp_hash);
    if (!isValid) {
      const newAttempts = reserved.rows[0].attempts;
      return res.status(400).json({
        success: false,
        error: `Invalid recovery code. ${Math.max(0, 5 - newAttempts)} attempts remaining.`,
      });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM admin_credentials WHERE id = 1 FOR UPDATE');
      const consumed = await client.query('UPDATE admin_password_resets SET used = true WHERE id = $1 AND used = false AND expires_at > NOW() RETURNING id', [row.id]);
      if (!consumed.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: "Invalid or expired recovery code" });
      }
      const changedUser = await client.query('UPDATE admin_users SET password_hash=$1,token_version=token_version+1,updated_at=NOW() WHERE email=$2 RETURNING id', [hash, targetEmail]);
      if (!changedUser.rowCount) await setPassword(hash, client);
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }

    // Send confirmation email that password was changed
    sendPasswordResetSuccessNotification({
      to: targetEmail,
      ip: verifyingIp,
      timestamp: new Date(),
    }).catch((err) => {
      console.error("⚠ Failed to send password reset confirmation email:", err.message);
    });

    res.json({ success: true, message: "Admin password successfully reset. You may now log in." });
  } catch (err) {
    res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" });
  }
});

const userSchema = z.object({
  email: z.string().email().max(255).transform(value => value.toLowerCase()),
  display_name: z.string().trim().min(1).max(100),
  password: z.string().min(12).max(72),
  role: z.enum(['owner','admin','editor','viewer']),
});

router.get('/users', verifyAdmin, requireRole('admin'), async (_req, res) => {
  const { rows } = await pool.query('SELECT id,email,display_name,role,active,totp_enabled,last_login_at,created_at FROM admin_users ORDER BY id');
  res.json({ success: true, data: rows });
});
router.post('/users', verifyAdmin, requireRole('admin'), validate(userSchema), async (req, res) => {
  if (req.body.role === 'owner' && req.admin.role !== 'owner') return res.status(403).json({ success: false, error: 'Only an owner can create another owner' });
  const hash = await bcrypt.hash(req.body.password, 12);
  const { rows } = await pool.query('INSERT INTO admin_users(email,display_name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email,display_name,role,active', [req.body.email, req.body.display_name, hash, req.body.role]);
  await audit(req, 'create_user', 'admin_users', rows[0].id, null, rows[0]);
  res.status(201).json({ success: true, data: rows[0] });
});
router.put('/users/:id', verifyAdmin, requireRole('admin'), validate(z.object({ display_name: z.string().trim().min(1).max(100).optional(), role: z.enum(['owner','admin','editor','viewer']).optional() }).refine(value => Object.keys(value).length > 0)), async (req, res) => {
  const targetUser = await pool.query('SELECT role FROM admin_users WHERE id=$1', [req.params.id]);
  if ((targetUser.rows[0]?.role === 'owner' || req.body.role === 'owner') && req.admin.role !== 'owner') return res.status(403).json({ success: false, error: 'Only an owner can manage owners' });
  if (String(req.admin.sub) === req.params.id && req.body.role && req.body.role !== 'owner' && req.admin.role === 'owner') {
    const owners = await pool.query("SELECT COUNT(*)::int AS count FROM admin_users WHERE role='owner' AND active=true");
    if (owners.rows[0].count < 2) return res.status(400).json({ success: false, error: 'At least one active owner is required' });
  }
  const { rows } = await pool.query(`UPDATE admin_users SET display_name=COALESCE($1,display_name),role=COALESCE($2,role),token_version=token_version+1,updated_at=NOW() WHERE id=$3 RETURNING id,email,display_name,role,active`, [req.body.display_name || null, req.body.role || null, req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
  await audit(req, 'update_user', 'admin_users', rows[0].id, null, rows[0]);
  res.json({ success: true, data: rows[0] });
});
router.put('/users/:id/status', verifyAdmin, requireRole('admin'), validate(z.object({ active: z.boolean() })), async (req, res) => {
  if (String(req.admin.sub) === req.params.id && !req.body.active) return res.status(400).json({ success: false, error: 'You cannot disable your own account' });
  const target = await pool.query('SELECT role FROM admin_users WHERE id=$1', [req.params.id]);
  if (!target.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
  if (target.rows[0].role === 'owner' && req.admin.role !== 'owner') {
    return res.status(403).json({ success: false, error: 'Only an owner can manage owners' });
  }
  if (!req.body.active && target.rows[0].role === 'owner') {
    const owners = await pool.query("SELECT COUNT(*)::int AS count FROM admin_users WHERE role='owner' AND active=true");
    if (owners.rows[0].count < 2) return res.status(400).json({ success: false, error: 'At least one active owner is required' });
  }
  const { rows } = await pool.query('UPDATE admin_users SET active=$1,token_version=token_version+1,updated_at=NOW() WHERE id=$2 RETURNING id,email,display_name,role,active', [req.body.active, req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
  await audit(req, req.body.active ? 'enable_user' : 'disable_user', 'admin_users', rows[0].id, null, rows[0]);
  res.json({ success: true, data: rows[0] });
});
router.post('/2fa/setup', verifyAdmin, async (req, res) => {
  if (!req.admin.sub) return res.status(400).json({ success: false, error: 'Migrate to an administrator user first' });
  const secret = authenticator.generateSecret();
  await pool.query('UPDATE admin_users SET pending_totp_secret=$1 WHERE id=$2', [totpSecret.encrypt(secret), req.admin.sub]);
  res.json({ success: true, data: { secret, otpauth: authenticator.keyuri(req.admin.email, 'Banglasketch', secret) } });
});
router.post('/2fa/enable', verifyAdmin, validate(z.object({ code: z.string().regex(/^\d{6}$/) })), async (req, res) => {
  const { rows } = await pool.query('SELECT totp_secret, pending_totp_secret FROM admin_users WHERE id=$1', [req.admin.sub]);
  const secretToVerify = rows[0]?.pending_totp_secret || rows[0]?.totp_secret;
  if (!secretToVerify || !authenticator.check(req.body.code, totpSecret.decrypt(secretToVerify))) return res.status(400).json({ success: false, error: 'Invalid two-factor code' });
  await pool.query('UPDATE admin_users SET totp_secret=$1, pending_totp_secret=NULL, totp_enabled=true, token_version=token_version+1 WHERE id=$2', [secretToVerify, req.admin.sub]);
  await audit(req, 'enable_2fa', 'admin_users', req.admin.sub);
  res.json({ success: true, message: 'Two-factor authentication enabled; sign in again' });
});
router.get('/audit', verifyAdmin, requireRole('admin'), async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows } = await pool.query('SELECT a.*,u.email AS actor_email FROM audit_logs a LEFT JOIN admin_users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT $1 OFFSET $2', [limit + 1, offset]);
  res.json({ success: true, data: rows.slice(0,limit), pagination: { page, limit, hasMore: rows.length > limit } });
});
router.get('/versions/:entity/:id', verifyAdmin, async (req, res) => {
  const table = ENTITY_TABLE_MAP[req.params.entity] || req.params.entity;
  if (!ADMIN_MUTATION_FIELDS[table]) return res.status(400).json({ success: false, error: 'Invalid entity' });
  const { rows } = await pool.query('SELECT id,version,snapshot,actor_id,created_at FROM content_versions WHERE entity_type=$1 AND entity_id=$2 ORDER BY version DESC LIMIT 100', [table, req.params.id]);
  res.json({ success: true, data: rows });
});
router.post('/restore/:entity/:id', verifyAdmin, requireRole('editor'), validate(z.object({ version: z.number().int().positive().optional() })), async (req, res) => {
  const table = ENTITY_TABLE_MAP[req.params.entity] || req.params.entity;
  if (!ADMIN_MUTATION_FIELDS[table]) return res.status(400).json({ success: false, error: 'Invalid entity' });
  const version = req.body.version
    ? await pool.query('SELECT snapshot FROM content_versions WHERE entity_type=$1 AND entity_id=$2 AND version=$3', [table, req.params.id, req.body.version])
    : null;
  if (req.body.version && !version.rows[0]) return res.status(404).json({ success: false, error: 'Version not found' });
  if (!req.body.version) {
    const { rows } = await pool.query(`UPDATE ${table} SET deleted_at=NULL WHERE id=$1 RETURNING *`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    await audit(req, 'restore', table, req.params.id, null, rows[0]);
    return res.json({ success: true, data: rows[0] });
  }
  const snapshotData = version.rows[0].snapshot;
  const fields = Object.keys(snapshotData).filter(field => ADMIN_MUTATION_FIELDS[table].has(field));
  const values = fields.map(field => ['gallery','cloudinary_ids','tags'].includes(field) ? JSON.stringify(snapshotData[field] || []) : snapshotData[field]);
  const updates = fields.map((field,index) => `${field}=$${index+1}`); values.push(req.params.id);
  const { rows } = await pool.query(`UPDATE ${table} SET ${updates.join(',')},deleted_at=NULL WHERE id=$${values.length} RETURNING *`, values);
  await snapshot(table, Number(req.params.id), rows[0], req.admin.sub); await audit(req, 'restore_version', table, req.params.id, null, rows[0]);
  res.json({ success: true, data: rows[0] });
});
router.delete('/trash/:entity/:id', verifyAdmin, requireRole('admin'), async (req, res) => {
  const table = ENTITY_TABLE_MAP[req.params.entity] || req.params.entity;
  if (!ADMIN_MUTATION_FIELDS[table]) return res.status(400).json({ success: false, error: 'Invalid entity' });
  const { rows } = await pool.query(`DELETE FROM ${table} WHERE id=$1 AND deleted_at IS NOT NULL RETURNING *`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, error: 'Deleted item not found' });
  await audit(req, 'permanent_delete', table, req.params.id, rows[0], null);
  for (const publicId of [rows[0].cloudinary_id, ...(rows[0].cloudinary_ids || [])].filter(Boolean)) await enqueue('cleanup_cloudinary', { publicId });
  res.json({ success: true });
});

// Cloudinary signature endpoint for signed uploads
router.get("/cloudinary-sign", verifyAdmin, (req, res) => {
  try {
    const cloudinary = require("../services/cloudinary");
    const timestamp = Math.round(new Date().getTime() / 1000);
    const requested = String(req.query.folder || "general").replace(/^banglasketch\//, '');
    if (!/^[a-z0-9_-]{1,40}$/i.test(requested)) return res.status(400).json({ success: false, error: 'Invalid upload folder' });
    const folder = `banglasketch/${requested}`;

    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ success: false, error: "Cloudinary is not configured on the backend" });
    }

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, allowed_formats: 'jpg,jpeg,png,webp,avif', max_bytes: 10485760, transformation: 'c_limit,w_4096,h_4096' },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      success: true,
      timestamp,
      folder,
      allowedFormats: ['jpg','jpeg','png','webp','avif'],
      maxBytes: 10485760,
      transformation: 'c_limit,w_4096,h_4096',
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" });
  }
});

module.exports = router;
