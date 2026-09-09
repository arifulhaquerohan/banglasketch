const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { sharedRateLimit } = require("../middleware/rateLimit");
const { pool } = require("../db");
const { schemas, validate } = require("../middleware/validate");

const enquiryLimiter = sharedRateLimit("enquiry", {
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many enquiries submitted. Please try again later." },
});

// POST /api/v1/enquiries (and /api/enquiries)
router.post("/", enquiryLimiter, validate(schemas.enquiry_create), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name,
      phone,
      email,
      project_location,
      property_type,
      service_scope,
      approx_budget,
      preferred_start_date,
      notes,
      attachments = [],
      website,
      started_at,
    } = req.body;

    // Honeypot spam protection
    if (website) {
      return res.status(201).json({
        success: true,
        message: "Thank you! Your consultation request has been received.",
      });
    }

    // Bot quick-submit check
    const started = Number(started_at);
    if (Number.isFinite(started) && Date.now() - started < 1500) {
      return res.status(400).json({
        success: false,
        error: "Please review your enquiry details and try again.",
      });
    }

    await client.query("BEGIN");

    // 1. Provision or associate Client by phone
    let clientId;
    const existingClient = await client.query(
      "SELECT id, email FROM clients WHERE phone = $1 AND deleted_at IS NULL LIMIT 1",
      [phone]
    );

    if (existingClient.rowCount > 0) {
      clientId = existingClient.rows[0].id;
      if (email && !existingClient.rows[0].email) {
        await client.query(
          "UPDATE clients SET email = $1, updated_at = NOW() WHERE id = $2",
          [email, clientId]
        );
      }
    } else {
      const portalToken = crypto.randomBytes(24).toString("hex");
      const newClient = await client.query(
        `INSERT INTO clients (name, phone, email, portal_token)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [name, phone, email || null, portalToken]
      );
      clientId = newClient.rows[0].id;
    }

    // 2. Insert Enquiry with default 24h follow-up target
    const defaultNextAction = "Initial call & qualification";
    const enquiryResult = await client.query(
      `INSERT INTO enquiries (
        client_id, name, phone, email, project_location,
        property_type, service_scope, approx_budget,
        preferred_start_date, notes, attachments,
        status, next_action, next_follow_up_date
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        'new_enquiry', $12, NOW() + INTERVAL '24 hours'
      ) RETURNING *`,
      [
        clientId,
        name,
        phone,
        email || null,
        project_location,
        property_type,
        service_scope,
        approx_budget || null,
        preferred_start_date || null,
        notes || null,
        JSON.stringify(attachments),
        defaultNextAction,
      ]
    );

    const enquiry = enquiryResult.rows[0];

    // 3. Log initial system follow-up note
    await client.query(
      `INSERT INTO enquiry_follow_ups (enquiry_id, channel, summary, next_action, scheduled_at)
       VALUES ($1, 'note', 'Enquiry received via website intake form.', $2, NOW() + INTERVAL '24 hours')`,
      [enquiry.id, defaultNextAction]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      data: {
        id: enquiry.id,
        clientId,
        status: enquiry.status,
      },
      message: "Thank you! Your enquiry has been received. Our team will contact you within 24 hours.",
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Enquiry submission error:", err);
    return res.status(500).json({ success: false, error: "Failed to submit enquiry" });
  } finally {
    client.release();
  }
});

module.exports = router;
