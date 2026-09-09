const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { pool } = require("../db");
const { verifyAdmin, requireRole } = require("../middleware/auth");
const { pagination } = require("../middleware/pagination");
const { schemas, validate } = require("../middleware/validate");
const { audit } = require("../services/audit");

router.use(verifyAdmin);

router.param("id", (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ success: false, error: "Invalid id" });
  }
  next();
});

// ==========================================
// 1. DASHBOARD ACTIONABLE SUMMARY
// ==========================================
router.get("/client-handling/dashboard", async (req, res) => {
  try {
    const [
      overdueFollowUps,
      pendingChangeOrders,
      unassignedLeads,
      overdueCount,
      pendingCount,
      unassignedCount,
      pipelineStats,
      activeProjectsCount,
    ] = await Promise.all([
      // Overdue follow-ups (preview list)
      pool.query(`
        SELECT e.id, e.name, e.phone, e.project_location, e.status, e.next_action, e.next_follow_up_date,
               u.display_name AS assigned_to_name
        FROM enquiries e
        LEFT JOIN admin_users u ON e.assigned_to = u.id
        WHERE e.deleted_at IS NULL
          AND e.status NOT IN ('closed', 'handover', 'active_project')
          AND e.next_follow_up_date < NOW()
        ORDER BY e.next_follow_up_date ASC
        LIMIT 10
      `),
      // Change orders awaiting approval (preview list)
      pool.query(`
        SELECT co.id, co.title, co.proposed_cost, co.timeline_impact_days, co.created_at,
               cp.id AS project_id, cp.title AS project_title, c.name AS client_name
        FROM change_orders co
        JOIN client_projects cp ON co.project_id = cp.id
        JOIN clients c ON cp.client_id = c.id
        WHERE co.status = 'pending_approval'
        ORDER BY co.created_at ASC
        LIMIT 10
      `),
      // New unassigned leads (preview list)
      pool.query(`
        SELECT id, name, phone, project_location, property_type, service_scope, created_at
        FROM enquiries
        WHERE deleted_at IS NULL
          AND assigned_to IS NULL
          AND status = 'new_enquiry'
        ORDER BY created_at DESC
        LIMIT 10
      `),
      // Total overdue follow-ups count
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM enquiries
        WHERE deleted_at IS NULL
          AND status NOT IN ('closed', 'handover', 'active_project')
          AND next_follow_up_date < NOW()
      `),
      // Total change orders awaiting approval count
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM change_orders
        WHERE status = 'pending_approval'
      `),
      // Total new unassigned leads count
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM enquiries
        WHERE deleted_at IS NULL
          AND assigned_to IS NULL
          AND status = 'new_enquiry'
      `),
      // Pipeline stage counts
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM enquiries
        WHERE deleted_at IS NULL
        GROUP BY status
      `),
      // Active projects count
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM client_projects
        WHERE deleted_at IS NULL AND stage NOT IN ('completed', 'closed', 'cancelled')
      `),
    ]);

    const pipelineMap = {};
    for (const row of pipelineStats.rows) {
      pipelineMap[row.status] = row.count;
    }

    res.json({
      success: true,
      data: {
        needsAttention: {
          overdueFollowUps: overdueFollowUps.rows,
          pendingChangeOrders: pendingChangeOrders.rows,
          unassignedLeads: unassignedLeads.rows,
          counts: {
            overdue: overdueCount.rows[0]?.count || 0,
            pendingApprovals: pendingCount.rows[0]?.count || 0,
            unassigned: unassignedCount.rows[0]?.count || 0,
          },
        },
        pipeline: pipelineMap,
        activeProjectsCount: activeProjectsCount.rows[0]?.count || 0,
      },
    });
  } catch (err) {
    console.error("Client dashboard error:", err);
    res.status(500).json({ success: false, error: "Failed to load dashboard metrics" });
  }
});

// ==========================================
// 2. ENQUIRIES & PIPELINE
// ==========================================

// Pipeline view: returns grouped stage columns
router.get("/enquiries/pipeline", async (req, res) => {
  try {
    const stages = [
      "new_enquiry",
      "contacted",
      "consultation",
      "site_visit",
      "proposal_sent",
      "approved",
      "active_project",
      "handover",
      "on_hold",
      "closed",
    ];

    const result = await pool.query(`
      SELECT e.*,
             u.display_name AS assigned_name,
             c.name AS client_name,
             (e.next_follow_up_date < NOW() AND e.status NOT IN ('closed', 'handover', 'active_project')) AS is_overdue
      FROM enquiries e
      LEFT JOIN admin_users u ON e.assigned_to = u.id
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.deleted_at IS NULL
      ORDER BY e.created_at DESC, e.id DESC
    `);

    const board = {};
    stages.forEach((s) => (board[s] = []));

    result.rows.forEach((row) => {
      if (board[row.status]) {
        board[row.status].push(row);
      }
    });

    res.json({
      success: true,
      data: {
        stages,
        columns: board,
        total: result.rowCount,
      },
    });
  } catch (err) {
    console.error("Pipeline board error:", err);
    res.status(500).json({ success: false, error: "Failed to load pipeline board" });
  }
});

// List enquiries with filtering and pagination
router.get("/enquiries", async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const { status, assigned_to, needs_attention, search } = req.query;

    const conditions = ["e.deleted_at IS NULL"];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`e.status = $${values.length}`);
    }

    if (assigned_to) {
      if (!/^\d+$/.test(String(assigned_to))) return res.status(400).json({ success: false, error: "Invalid assigned_to" });
      values.push(assigned_to);
      conditions.push(`e.assigned_to = $${values.length}`);
    }

    if (needs_attention === "true") {
      conditions.push(`(
        (e.next_follow_up_date < NOW() AND e.status NOT IN ('closed', 'handover', 'active_project'))
        OR (e.assigned_to IS NULL AND e.status = 'new_enquiry')
        OR ((e.next_action IS NULL OR TRIM(e.next_action) = '') AND e.status NOT IN ('closed', 'handover'))
      )`);
    }

    if (search) {
      values.push(`%${search.trim().toLowerCase()}%`);
      const idx = values.length;
      conditions.push(`(
        LOWER(e.name) LIKE $${idx} OR
        LOWER(e.phone) LIKE $${idx} OR
        LOWER(COALESCE(e.email, '')) LIKE $${idx} OR
        LOWER(e.project_location) LIKE $${idx}
      )`);
    }

    values.push(limit + 1, offset);
    const query = `
      SELECT e.*,
             u.display_name AS assigned_name,
             c.name AS client_name,
             c.portal_token,
             (e.next_follow_up_date < NOW() AND e.status NOT IN ('closed', 'handover', 'active_project')) AS is_overdue
      FROM enquiries e
      LEFT JOIN admin_users u ON e.assigned_to = u.id
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await pool.query(query, values);
    const hasMore = result.rows.length > limit;
    const data = hasMore ? result.rows.slice(0, limit) : result.rows;

    res.json({
      success: true,
      data,
      pagination: { page, limit, hasMore },
    });
  } catch (err) {
    console.error("List enquiries error:", err);
    res.status(500).json({ success: false, error: "Failed to list enquiries" });
  }
});

// Single enquiry details with client profile and follow-up timeline
router.get("/enquiries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const enquiryRes = await pool.query(
      `SELECT e.*,
              u.display_name AS assigned_name,
              c.name AS client_name,
              c.phone AS client_phone,
              c.email AS client_email,
              c.alternate_phone AS client_alt_phone,
              c.portal_token,
              c.notes AS client_notes
       FROM enquiries e
       LEFT JOIN admin_users u ON e.assigned_to = u.id
       LEFT JOIN clients c ON e.client_id = c.id
       WHERE e.id = $1 AND e.deleted_at IS NULL`,
      [id]
    );

    if (!enquiryRes.rows.length) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    const followUpsRes = await pool.query(
      `SELECT ef.*, u.display_name AS actor_name
       FROM enquiry_follow_ups ef
       LEFT JOIN admin_users u ON ef.actor_id = u.id
       WHERE ef.enquiry_id = $1
       ORDER BY ef.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        enquiry: enquiryRes.rows[0],
        followUps: followUpsRes.rows,
      },
    });
  } catch (err) {
    console.error("Get enquiry error:", err);
    res.status(500).json({ success: false, error: "Failed to get enquiry" });
  }
});

// Update enquiry (stage progression, owner assignment, next follow-up)
router.patch("/enquiries/:id", requireRole("editor"), validate(schemas.enquiry_update, true), async (req, res) => {
  try {
    const { id } = req.params;
    const existingRes = await pool.query(
      "SELECT * FROM enquiries WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (!existingRes.rows.length) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }
    const before = existingRes.rows[0];

    const updates = [];
    const values = [];
    const fields = [
      "status",
      "status_reason",
      "assigned_to",
      "next_action",
      "next_follow_up_date",
      "notes",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        values.push(req.body[field] === "" ? null : req.body[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) {
      return res.status(400).json({ success: false, error: "No fields provided to update" });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    const query = `UPDATE enquiries SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);
    const after = result.rows[0];

    await audit(req, "update", "enquiries", id, before, after);

    // If status changed, log an automatic follow-up note
    if (before.status !== after.status) {
      await pool.query(
        `INSERT INTO enquiry_follow_ups (enquiry_id, actor_id, channel, summary, next_action, scheduled_at)
         VALUES ($1, $2, 'note', $3, $4, $5)`,
        [
          id,
          req.admin?.sub || null,
          `Stage updated from "${before.status}" to "${after.status}"${after.status_reason ? ` (${after.status_reason})` : ""}`,
          after.next_action,
          after.next_follow_up_date,
        ]
      );
    }

    res.json({ success: true, data: after });
  } catch (err) {
    console.error("Update enquiry error:", err);
    res.status(500).json({ success: false, error: "Failed to update enquiry" });
  }
});

// Add follow-up communication record to enquiry
router.post("/enquiries/:id/follow-ups", requireRole("editor"), validate(schemas.follow_up_create), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { channel, summary, next_action, scheduled_at } = req.body;

    await client.query("BEGIN");

    const enquiryRes = await client.query(
      "SELECT * FROM enquiries WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (!enquiryRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    // Insert follow-up entry
    const insertRes = await client.query(
      `INSERT INTO enquiry_follow_ups (enquiry_id, actor_id, channel, summary, next_action, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, req.admin?.sub || null, channel, summary, next_action || null, scheduled_at || null]
    );

    // Automatically synchronize enquiry's next_action and next_follow_up_date
    if (next_action || scheduled_at) {
      await client.query(
        `UPDATE enquiries
         SET next_action = COALESCE($1, next_action),
             next_follow_up_date = COALESCE($2, next_follow_up_date),
             updated_at = NOW()
         WHERE id = $3`,
        [next_action || null, scheduled_at || null, id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({ success: true, data: insertRes.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Add follow-up error:", err);
    res.status(500).json({ success: false, error: "Failed to record follow-up" });
  } finally {
    client.release();
  }
});

// Convert approved enquiry into an active client project
router.post("/enquiries/:id/convert-to-project", requireRole("editor"), validate(schemas.convert_to_project), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { title, agreed_scope, agreed_budget = 0, project_manager_id } = req.body || {};

    await client.query("BEGIN");

    const enquiryRes = await client.query(
      "SELECT * FROM enquiries WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
      [id]
    );
    if (!enquiryRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }
    const enquiry = enquiryRes.rows[0];

    // Check if project was already created for this enquiry to prevent duplicates
    const existingProject = await client.query(
      "SELECT * FROM client_projects WHERE enquiry_id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (existingProject.rows.length > 0) {
      await client.query("COMMIT");
      return res.status(200).json({
        success: true,
        data: existingProject.rows[0],
        message: "Enquiry was already converted to project.",
      });
    }

    // Ensure client exists and link to enquiry
    let clientId = enquiry.client_id;
    if (!clientId) {
      const existingClient = await client.query(
        "SELECT id FROM clients WHERE phone = $1 AND deleted_at IS NULL LIMIT 1",
        [enquiry.phone]
      );
      if (existingClient.rowCount > 0) {
        clientId = existingClient.rows[0].id;
      } else {
        const portalToken = crypto.randomBytes(24).toString("hex");
        const newClient = await client.query(
          "INSERT INTO clients (name, phone, email, portal_token) VALUES ($1, $2, $3, $4) RETURNING id",
          [enquiry.name, enquiry.phone, enquiry.email || null, portalToken]
        );
        clientId = newClient.rows[0].id;
      }
      await client.query("UPDATE enquiries SET client_id = $1 WHERE id = $2", [clientId, id]);
    }

    const projectTitle = title || `${enquiry.name}'s ${enquiry.property_type || "Interior"} Project`;

    const projectRes = await client.query(
      `INSERT INTO client_projects (
        client_id, enquiry_id, title, stage, current_milestone, next_milestone,
        project_manager_id, agreed_scope, agreed_budget
      ) VALUES ($1, $2, $3, 'active_project', 'Kickoff & Concept Confirmation', 'Detailed Architectural Layout', $4, $5, $6)
      RETURNING *`,
      [
        clientId,
        enquiry.id,
        projectTitle,
        project_manager_id || enquiry.assigned_to || req.admin?.sub || null,
        agreed_scope || enquiry.notes || "Agreed architectural and interior design scope",
        Number(agreed_budget) || 0,
      ]
    );

    // Update enquiry status to active_project
    await client.query(
      `UPDATE enquiries
       SET status = 'active_project',
           next_action = 'Project onboarding & kickoff meeting',
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    await client.query(
      `INSERT INTO enquiry_follow_ups (enquiry_id, actor_id, channel, summary, next_action)
       VALUES ($1, $2, 'note', $3, 'Project onboarding & kickoff meeting')`,
      [id, req.admin?.sub || null, `Promoted to active client project #${projectRes.rows[0].id}`]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: projectRes.rows[0],
      message: "Enquiry successfully promoted to active project.",
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Convert to project error:", err);
    res.status(500).json({ success: false, error: "Failed to convert enquiry to project" });
  } finally {
    client.release();
  }
});

// ==========================================
// 3. CLIENT PROJECTS & APPROVALS
// ==========================================

// List client projects
router.get("/client-projects", async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const { stage, client_id } = req.query;

    const conditions = ["cp.deleted_at IS NULL"];
    const values = [];

    if (stage) {
      values.push(stage);
      conditions.push(`cp.stage = $${values.length}`);
    }

    if (client_id) {
      if (!/^\d+$/.test(String(client_id))) return res.status(400).json({ success: false, error: "Invalid client_id" });
      values.push(client_id);
      conditions.push(`cp.client_id = $${values.length}`);
    }

    values.push(limit + 1, offset);

    const result = await pool.query(
      `SELECT cp.*,
              c.name AS client_name,
              c.phone AS client_phone,
              c.email AS client_email,
              u.display_name AS project_manager_name,
              COALESCE((SELECT COUNT(*) FROM change_orders co WHERE co.project_id = cp.id AND co.status = 'pending_approval'), 0)::int AS pending_change_orders_count
       FROM client_projects cp
       JOIN clients c ON cp.client_id = c.id
       LEFT JOIN admin_users u ON cp.project_manager_id = u.id
       WHERE ${conditions.join(" AND ")}
       ORDER BY cp.created_at DESC, cp.id DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const hasMore = result.rows.length > limit;
    const data = hasMore ? result.rows.slice(0, limit) : result.rows;

    res.json({
      success: true,
      data,
      pagination: { page, limit, hasMore },
    });
  } catch (err) {
    console.error("List client projects error:", err);
    res.status(500).json({ success: false, error: "Failed to list client projects" });
  }
});

// Get single client project with proposals and change orders
router.get("/client-projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const projectRes = await pool.query(
      `SELECT cp.*,
              c.name AS client_name,
              c.phone AS client_phone,
              c.email AS client_email,
              c.portal_token,
              u.display_name AS project_manager_name
       FROM client_projects cp
       JOIN clients c ON cp.client_id = c.id
       LEFT JOIN admin_users u ON cp.project_manager_id = u.id
       WHERE cp.id = $1 AND cp.deleted_at IS NULL`,
      [id]
    );

    if (!projectRes.rows.length) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const [proposalsRes, changeOrdersRes] = await Promise.all([
      pool.query(
        `SELECT p.*,
                COALESCE((SELECT json_agg(pv ORDER BY pv.version DESC)
                 FROM proposal_versions pv WHERE pv.proposal_id = p.id), '[]'::json) AS versions
         FROM proposals p
         WHERE p.project_id = $1
         ORDER BY p.created_at DESC, p.id DESC`,
        [id]
      ),
      pool.query(
        `SELECT co.*, u.display_name AS requested_by_name
         FROM change_orders co
         LEFT JOIN admin_users u ON co.requested_by = u.id
         WHERE co.project_id = $1
         ORDER BY co.created_at DESC, co.id DESC`,
        [id]
      ),
    ]);

    res.json({
      success: true,
      data: {
        project: projectRes.rows[0],
        proposals: proposalsRes.rows,
        changeOrders: changeOrdersRes.rows,
      },
    });
  } catch (err) {
    console.error("Get client project error:", err);
    res.status(500).json({ success: false, error: "Failed to get client project" });
  }
});

// Update client project
router.patch("/client-projects/:id", requireRole("editor"), validate(schemas.client_project_update, true), async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      "stage",
      "current_milestone",
      "next_milestone",
      "project_manager_id",
      "agreed_scope",
      "agreed_budget",
      "target_completion_date",
    ];

    const updates = [];
    const values = [];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const val = (field === "target_completion_date" && req.body[field] === "") ? null : req.body[field];
        values.push(val);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    const result = await pool.query(
      `UPDATE client_projects SET ${updates.join(", ")} WHERE id = $${values.length} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ success: false, error: "Failed to update project" });
  }
});

// Create proposal with version 1
router.post("/client-projects/:id/proposals", requireRole("editor"), validate(schemas.proposal_create), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { title, scope_summary, proposed_cost, timeline_days, documents = [] } = req.body;

    await client.query("BEGIN");

    const projectCheck = await client.query(
      "SELECT id FROM client_projects WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (!projectCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const proposalRes = await client.query(
      `INSERT INTO proposals (project_id, title, status)
       VALUES ($1, $2, 'draft')
       RETURNING *`,
      [id, title]
    );
    const proposal = proposalRes.rows[0];

    const versionRes = await client.query(
      `INSERT INTO proposal_versions (proposal_id, version, scope_summary, proposed_cost, timeline_days, documents, actor_id)
       VALUES ($1, 1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [proposal.id, scope_summary, proposed_cost, timeline_days || null, JSON.stringify(documents), req.admin?.sub || null]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: {
        ...proposal,
        version: versionRes.rows[0],
      },
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Create proposal error:", err);
    res.status(500).json({ success: false, error: "Failed to create proposal" });
  } finally {
    client.release();
  }
});

// Add a new revision version to an existing proposal
router.post("/proposals/:id/versions", requireRole("editor"), validate(schemas.proposal_version_create), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { scope_summary, proposed_cost, timeline_days, documents = [] } = req.body;

    await client.query("BEGIN");

    const proposalCheck = await client.query(
      "SELECT id, status FROM proposals WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (!proposalCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Proposal not found" });
    }

    const nextVersionRes = await client.query(
      "SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM proposal_versions WHERE proposal_id = $1",
      [id]
    );
    const versionNumber = nextVersionRes.rows[0].next_version;

    const versionRes = await client.query(
      `INSERT INTO proposal_versions (proposal_id, version, scope_summary, proposed_cost, timeline_days, documents, actor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, versionNumber, scope_summary, proposed_cost, timeline_days || null, JSON.stringify(documents), req.admin?.sub || null]
    );

    await client.query("UPDATE proposals SET updated_at = NOW() WHERE id = $1", [id]);
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: versionRes.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Add proposal version error:", err);
    res.status(500).json({ success: false, error: "Failed to add proposal version" });
  } finally {
    client.release();
  }
});

// Record proposal approval
router.post("/proposals/:id/approve", requireRole("editor"), validate(schemas.proposal_approve), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { version, approval_notes } = req.body || {};

    await client.query("BEGIN");

    const proposalRes = await client.query("SELECT * FROM proposals WHERE id = $1", [id]);
    if (!proposalRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Proposal not found" });
    }
    const proposal = proposalRes.rows[0];

    // Get specific version or latest version
    const versionQuery = version
      ? "SELECT * FROM proposal_versions WHERE proposal_id = $1 AND version = $2"
      : "SELECT * FROM proposal_versions WHERE proposal_id = $1 ORDER BY version DESC LIMIT 1";
    const versionParams = version ? [id, version] : [id];
    const versionRes = await client.query(versionQuery, versionParams);

    if (!versionRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Specified proposal version not found" });
    }
    const approvedVersion = versionRes.rows[0];

    // Mark previous approved proposals for this project as superseded
    await client.query(
      `UPDATE proposals
       SET status = 'superseded', updated_at = NOW()
       WHERE project_id = $1 AND id != $2 AND status = 'approved'`,
      [proposal.project_id, id]
    );

    // Mark proposal approved
    const updatedProposal = await client.query(
      `UPDATE proposals
       SET status = 'approved',
           approved_version = $1,
           approved_at = NOW(),
           approval_notes = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [approvedVersion.version, approval_notes || "Client signed off on scope & cost", id]
    );

    // Update the project's agreed baseline budget with the approved version cost
    await client.query(
      `UPDATE client_projects
       SET agreed_budget = $1,
           stage = 'approved',
           updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL`,
      [approvedVersion.proposed_cost, proposal.project_id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      data: {
        proposal: updatedProposal.rows[0],
        approvedVersion,
      },
      message: `Proposal #${id} approved at Version ${approvedVersion.version}. Baseline agreed budget updated.`,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Approve proposal error:", err);
    res.status(500).json({ success: false, error: "Failed to approve proposal" });
  } finally {
    client.release();
  }
});

// ==========================================
// 4. SCOPE CHANGES & APPROVALS (CHANGE ORDERS)
// ==========================================

// Create a change order
router.post("/client-projects/:id/change-orders", requireRole("editor"), validate(schemas.change_order_create), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, proposed_cost, timeline_impact_days } = req.body;

    const projectCheck = await pool.query(
      "SELECT id FROM client_projects WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (!projectCheck.rows.length) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const result = await pool.query(
      `INSERT INTO change_orders (project_id, title, description, proposed_cost, timeline_impact_days, status, requested_by)
       VALUES ($1, $2, $3, $4, $5, 'pending_approval', $6)
       RETURNING *`,
      [id, title, description, proposed_cost, timeline_impact_days, req.admin?.sub || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Change order logged and awaiting client approval.",
    });
  } catch (err) {
    console.error("Create change order error:", err);
    res.status(500).json({ success: false, error: "Failed to create change order" });
  }
});

// Decide on a change order (Approve or Reject)
router.post("/change-orders/:id/decision", requireRole("editor"), validate(schemas.change_order_decision), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, client_notes } = req.body;

    const existingRes = await pool.query("SELECT * FROM change_orders WHERE id = $1", [id]);
    if (!existingRes.rows.length) {
      return res.status(404).json({ success: false, error: "Change order not found" });
    }
    const changeOrder = existingRes.rows[0];

    const result = await pool.query(
      `UPDATE change_orders
       SET status = $1,
           client_notes = $2,
           decided_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, client_notes || null, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: `Change order #${id} has been marked as ${status}.`,
    });
  } catch (err) {
    console.error("Change order decision error:", err);
    res.status(500).json({ success: false, error: "Failed to record change order decision" });
  }
});

module.exports = router;
