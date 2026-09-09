const express = require("express");
const router = express.Router();
const { sharedRateLimit } = require("../middleware/rateLimit");
const { pool } = require("../db");
const { saveContact } = require("../services/contactQueue");

const limiter = sharedRateLimit("contact", {
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many inquiries submitted. Please try again in 15 minutes." },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 5000;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

// POST /api/contact
router.post("/", limiter, async (req, res) => {
  try {
    if (req.body?.website) return res.status(201).json({ success: true, message: "Thank you! Your inquiry has been received." });
    const startedAt = Number(req.body?.started_at);
    if (Number.isFinite(startedAt) && Date.now() - startedAt < 1500) return res.status(400).json({ success: false, error: "Please review your message and try again" });
    const name = cleanString(req.body?.name);
    const email = cleanString(req.body?.email).toLowerCase();
    const phone = cleanString(req.body?.phone);
    const serviceType = cleanString(req.body?.service_type);
    const message = cleanString(req.body?.message);

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Name, email, and message are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email" });
    }
    const blockedDomains = new Set((process.env.DISPOSABLE_EMAIL_DOMAINS || 'mailinator.com,guerrillamail.com,10minutemail.com').split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
    if (blockedDomains.has(email.split('@')[1])) return res.status(400).json({ success: false, error: 'Please use a permanent email address' });

    if (
      name.length > MAX_FIELD_LENGTH ||
      email.length > MAX_FIELD_LENGTH ||
      phone.length > 50 ||
      serviceType.length > 100 ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return res.status(400).json({ success: false, error: "One or more fields are too long" });
    }

    const submission = await saveContact([name, email, phone || null, serviceType || null, message]);

    return res.status(201).json({
      success: true,
      id: submission.id,
      message: "Thank you! Your inquiry has been received. We will be in touch within 24 hours.",
    });
  } catch (err) {
    console.error("Contact error:", err);
    return res.status(500).json({ success: false, error: "Failed to submit inquiry" });
  }
});

module.exports = router;
