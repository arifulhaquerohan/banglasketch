// Banglasketch Express Backend Server
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { sharedRateLimit } = require("./middleware/rateLimit");
const dotenv = require("dotenv");
const path = require("path");

// Load env before anything else reads process.env
dotenv.config({ path: path.join(__dirname, ".env") });

const { pool } = require("./db");
const { migrate } = require("./services/migrations");
const metrics = require("./services/metrics");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === "production";

// Trust only configured proxy addresses, never an arbitrary number of hops.
app.set("trust proxy", process.env.TRUST_PROXY ? process.env.TRUST_PROXY.split(",").map(s => s.trim()) : "loopback");
app.disable("x-powered-by");
app.use((req, res, next) => {
  req.id = req.get("x-request-id") || crypto.randomUUID();
  res.set("x-request-id", req.id);
  const started = Date.now();
  res.on("finish", () => console.log(JSON.stringify({ level: "info", requestId: req.id, method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: Date.now() - started })));
  next();
});
app.use(metrics.middleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
const loginLimiter = sharedRateLimit("login", {
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 5 : 100,
  message: { success: false, error: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
const otpRequestLimiter = sharedRateLimit("otpRequest", {
  windowMs: 60 * 1000,
  max: IS_PROD ? 3 : 20,
  message: { success: false, error: "Too many OTP requests. Please wait a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});
const otpVerifyLimiter = sharedRateLimit("otpVerify", {
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 10 : 50,
  message: { success: false, error: "Too many verification attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = sharedRateLimit("api", {
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header are non-browser requests such as health checks.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
// Apply rate limits
app.use("/api/admin/login", loginLimiter);
app.use("/api/admin/request-reset-otp", otpRequestLimiter);
app.use("/api/admin/verify-reset-otp", otpVerifyLimiter);
app.use("/api/", apiLimiter);

// Images go straight to Cloudinary, so JSON bodies never need to be huge
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d" }));

const initDB = async () => {
  await migrate();
  if (process.env.ADMIN_PASSWORD_HASH) {
    await pool.query('INSERT INTO admin_credentials(id,password_hash) VALUES(1,$1) ON CONFLICT(id) DO NOTHING', [process.env.ADMIN_PASSWORD_HASH]);
  }
  const email = (process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || 'admin@localhost').trim().toLowerCase();
  await pool.query(`INSERT INTO admin_users(email,display_name,password_hash,role)
    SELECT $1,'Administrator',password_hash,'owner' FROM admin_credentials WHERE id=1
    ON CONFLICT(email) DO NOTHING`, [email]);
  console.log("✓ Database migrations applied");
};

// Routes
app.use("/api/projects", require("./routes/projects"));
app.use("/api/blog", require("./routes/blog"));
app.use("/api/videos", require("./routes/videos"));
app.use("/api/testimonials", require("./routes/testimonials"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/newsletter", require("./routes/newsletter"));
app.use("/api/enquiries", require("./routes/enquiries"));
app.use("/api/portal", require("./routes/portal"));
app.use("/api/admin", (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin", require("./routes/adminClientHandling"));

// Versioned public API. Legacy /api routes remain available for existing clients.
for (const [name, route] of [["projects","projects"],["blog","blog"],["videos","videos"],["testimonials","testimonials"],["contact","contact"],["newsletter","newsletter"],["enquiries","enquiries"],["portal","portal"]]) {
  app.use(`/api/v1/${name}`, require(`./routes/${route}`));
}

// Health check (also reports DB reachability so uptime monitors catch outages)
app.get("/api/health", async (req, res) => {
  let database = "ok";
  try {
    await pool.query("SELECT 1");
  } catch {
    database = "unavailable";
  }
  res.status(database === "ok" ? 200 : 503).json({
    status: database === "ok" ? "ok" : "degraded",
    service: "Banglasketch API",
    database,
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});
app.get("/health/live", (_req, res) => res.json({ status: "ok", uptime: Math.round(process.uptime()) }));
app.get("/health/ready", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ status: "ready" }); }
  catch { res.status(503).json({ status: "unavailable" }); }
});
app.get("/metrics", async (req, res) => {
  if (!process.env.METRICS_TOKEN || req.get("authorization") !== `Bearer ${process.env.METRICS_TOKEN}`) return res.status(401).end();
  await metrics.collectDatabaseMetrics(pool);
  res.type(metrics.register.contentType).send(await metrics.register.metrics());
});

// 404 for unknown API routes (JSON instead of Express' HTML page)
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, error: "Request body too large" });
  }
  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({ success: false, error: err.message });
  }
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: IS_PROD ? "Unable to process request" : err.message || "Internal server error",
  });
});

// Start
let server;
let stopWorker = async () => {};
let stopJobs = () => {};
let viewTimer;
let cleanupTimer;
const { flushViews } = require("./services/blogViews");

// Start server whether invoked directly or via Phusion Passenger
const startServer = () => {
  return initDB().then(() => {
    // In cPanel Phusion Passenger, PORT can be a named pipe/socket string or a port number
    const listenTarget = isNaN(Number(PORT)) ? PORT : parseInt(PORT, 10);
    const host = isNaN(Number(PORT)) ? undefined : (process.env.HOST || "0.0.0.0");

    const onListen = () => {
      console.log(`\n✓ Banglasketch API running on ${listenTarget}`);
      console.log(`✓ Health check active\n`);
    };

    server = host ? app.listen(listenTarget, host, onListen) : app.listen(listenTarget, onListen);

    stopWorker = require('./services/contactQueue').startWorker();
    stopJobs = require('./services/jobs').startWorker();
    viewTimer = setInterval(() => flushViews().catch(err => console.error('View flush failed:', err.message)), 30000);
    viewTimer.unref();
    server.requestTimeout = 30000;
    server.headersTimeout = 15000;
    cleanupTimer = setInterval(() => pool.query("DELETE FROM rate_limit_counters WHERE expires_at < NOW() - INTERVAL '1 hour'").catch(err => console.error('Rate limit cleanup failed:', err.message)), 60000);
    cleanupTimer.unref();
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${PORT} is already in use by another process.`);
        console.error(`👉 To free port ${PORT}, run: fuser -k ${PORT}/tcp\n`);
      } else {
        console.error("Server error:", err);
      }
      process.exit(1);
    });
    return server;
  }).catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
};

const isDirectRun = require.main === module ||
  Boolean(require.main?.filename?.endsWith('app.js')) ||
  Boolean(require.main?.filename?.endsWith('cpanel-runner.js'));

if (isDirectRun) {
  startServer();
}

// Graceful shutdown: stop accepting connections, then drain the pool
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  const closePool = async () => {
    clearInterval(viewTimer);
    clearInterval(cleanupTimer);
    await stopWorker();
    stopJobs();
    await flushViews().catch(() => {});
    await pool.end().catch(() => {});
    process.exit(0);
  };
  if (server) server.close(closePool);
  else closePool();
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = { app, pool, initDB, startServer };
