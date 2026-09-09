const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { sharedRateLimit } = require("../middleware/rateLimit");

const portalLimiter = sharedRateLimit("portal", {
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests to client portal. Please try again later." },
});

// GET /api/portal/:token or /api/v1/portal/:token
router.get("/:token", portalLimiter, async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
      return res.status(400).json({ success: false, error: "Invalid portal token" });
    }

    // 1. Fetch client
    const clientRes = await pool.query(
      `SELECT id, name, phone, email, created_at
       FROM clients
       WHERE portal_token = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [token]
    );

    if (!clientRes.rows.length) {
      return res.status(404).json({
        success: false,
        error: "Client portal not found or access link has expired",
      });
    }

    const client = clientRes.rows[0];

    // 2. Fetch projects
    const projectsRes = await pool.query(
      `SELECT cp.id, cp.title, cp.stage, cp.current_milestone, cp.next_milestone,
              cp.agreed_scope, cp.agreed_budget, cp.target_completion_date,
              cp.created_at, cp.updated_at,
              u.display_name AS project_manager_name
       FROM client_projects cp
       LEFT JOIN admin_users u ON cp.project_manager_id = u.id
       WHERE cp.client_id = $1 AND cp.deleted_at IS NULL
       ORDER BY cp.created_at DESC`,
      [client.id]
    );

    const projectIds = projectsRes.rows.map((p) => p.id);
    let proposalsByProject = {};
    let changeOrdersByProject = {};

    if (projectIds.length > 0) {
      // 3. Fetch proposals (only sent, approved, or superseded - hide internal drafts)
      const proposalsRes = await pool.query(
        `SELECT p.id, p.project_id, p.title, p.status, p.approved_version, p.approved_at,
                pv.id AS version_id, pv.version, pv.scope_summary, pv.proposed_cost, pv.timeline_days, pv.documents, pv.created_at AS version_created_at
         FROM proposals p
         LEFT JOIN proposal_versions pv ON p.id = pv.proposal_id
         WHERE p.project_id = ANY($1)
           AND p.status IN ('sent', 'approved', 'superseded')
         ORDER BY p.id ASC, pv.version DESC`,
        [projectIds]
      );

      const pMap = {};
      for (const row of proposalsRes.rows) {
        if (!pMap[row.id]) {
          pMap[row.id] = {
            id: row.id,
            project_id: row.project_id,
            title: row.title,
            status: row.status,
            approved_version: row.approved_version,
            approved_at: row.approved_at,
            versions: [],
          };
        }
        if (row.version) {
          pMap[row.id].versions.push({
            id: row.version_id,
            version: row.version,
            scope_summary: row.scope_summary,
            proposed_cost: row.proposed_cost,
            timeline_days: row.timeline_days,
            documents: row.documents || [],
            created_at: row.version_created_at,
          });
        }
      }

      for (const p of Object.values(pMap)) {
        if (!proposalsByProject[p.project_id]) proposalsByProject[p.project_id] = [];
        proposalsByProject[p.project_id].push(p);
      }

      // 4. Fetch change orders
      const changesRes = await pool.query(
        `SELECT id, project_id, title, description, proposed_cost,
                timeline_impact_days, status, client_notes, decided_at, created_at
         FROM change_orders
         WHERE project_id = ANY($1)
         ORDER BY created_at DESC`,
        [projectIds]
      );

      for (const co of changesRes.rows) {
        if (!changeOrdersByProject[co.project_id]) changeOrdersByProject[co.project_id] = [];
        changeOrdersByProject[co.project_id].push(co);
      }
    }

    // 5. Fetch enquiries history
    const enquiriesRes = await pool.query(
      `SELECT id, project_location, property_type, service_scope, status, approx_budget, created_at
       FROM enquiries
       WHERE client_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [client.id]
    );

    const formattedProjects = projectsRes.rows.map((p) => ({
      ...p,
      proposals: proposalsByProject[p.id] || [],
      changeOrders: changeOrdersByProject[p.id] || [],
    }));

    res.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.json({
      success: true,
      data: {
        client: {
          name: client.name,
          email: client.email,
          phone: client.phone,
          memberSince: client.created_at,
        },
        projects: formattedProjects,
        enquiries: enquiriesRes.rows,
      },
    });
  } catch (err) {
    console.error("Portal error:", err);
    res.status(500).json({ success: false, error: "Failed to load portal data" });
  }
});

module.exports = router;
