const express = require("express");
const { sharedRateLimit } = require("../middleware/rateLimit");
const router = express.Router();
const { pool } = require("../db");

const limiter = sharedRateLimit("newsletter", {
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many subscription attempts. Please try again in 15 minutes." },
});
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", limiter, async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || email.length > 160 || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Valid email required" });
    }

    await pool.query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET active = true`,
      [email]
    );

    return res.status(201).json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    return res.status(500).json({ success: false, error: "Unable to save subscription" });
  }
});

module.exports = router;
