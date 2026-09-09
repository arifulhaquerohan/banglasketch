const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// Test database safety guard: abort if TEST_DATABASE_URL is not set
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'E2E tests aborted: TEST_DATABASE_URL must be explicitly set to an isolated test database to protect application data.'
  );
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
try {
  const parsed = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error('E2E tests require an isolated local test database (localhost or 127.0.0.1)');
  }
} catch (err) {
  throw new Error(`Invalid TEST_DATABASE_URL: ${err.message}`);
}

const { app, pool } = require('../server');

let server;
let baseUrl;
let adminToken;
let createdEnquiryId;
let createdClientId;
let createdProjectId;
let createdProposalId;
let createdChangeOrderId;

const TEST_PHONE = '+8801700999888';

before(async () => {
  // Generate admin token for user id 1 (owner)
  const userRes = await pool.query("SELECT id, email, role, token_version FROM admin_users WHERE id = 1");
  const user = userRes.rows[0] || { id: 1, email: 'admin@example.com', role: 'owner', token_version: 1 };

  adminToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, version: user.token_version },
    process.env.ADMIN_JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test('1. Public enquiry intake creates client and enquiry with default 24h follow-up', async () => {
  const payload = {
    name: 'E2E Test Client',
    phone: TEST_PHONE,
    email: 'e2e.client@example.com',
    project_location: 'Banani DOHS, Dhaka',
    property_type: 'apartment',
    service_scope: 'interior_design',
    approx_budget: '25-30 Lakhs BDT',
    preferred_start_date: 'Immediate',
    notes: 'Automated test enquiry submission for architectural consultation.',
    attachments: [],
    started_at: Date.now() - 2500, // anti-spam timing valid
  };

  const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  assert.equal(res.status, 201, `Failed to submit enquiry: ${JSON.stringify(json)}`);
  assert.equal(json.success, true);
  assert.ok(json.data.id);
  assert.ok(json.data.clientId);

  createdEnquiryId = json.data.id;
  createdClientId = json.data.clientId;

  // Verify client record in DB
  const clientRow = (await pool.query('SELECT * FROM clients WHERE id = $1', [createdClientId])).rows[0];
  assert.ok(clientRow);
  assert.equal(clientRow.phone, TEST_PHONE);
  assert.ok(clientRow.portal_token);

  // Verify initial follow-up note was automatically logged
  const followUpRows = (await pool.query('SELECT * FROM enquiry_follow_ups WHERE enquiry_id = $1', [createdEnquiryId])).rows;
  assert.ok(followUpRows.length >= 1);
  assert.equal(followUpRows[0].channel, 'note');
});

test('2. Admin can view pipeline board and filter enquiries', async () => {
  // Test pipeline Kanban
  const pipeRes = await fetch(`${baseUrl}/api/admin/enquiries/pipeline`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const pipeJson = await pipeRes.json();
  assert.equal(pipeRes.status, 200);
  assert.equal(pipeJson.success, true);
  assert.ok(pipeJson.data.columns.new_enquiry);
  const foundInNew = pipeJson.data.columns.new_enquiry.find((e) => e.id === createdEnquiryId);
  assert.ok(foundInNew, 'Newly created enquiry should appear in new_enquiry stage');

  // Test enquiry detail
  const detailRes = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const detailJson = await detailRes.json();
  assert.equal(detailRes.status, 200);
  assert.equal(detailJson.data.enquiry.id, createdEnquiryId);
  assert.equal(detailJson.data.enquiry.client_phone, TEST_PHONE);
});

test('3. Admin can update stage and record communication history', async () => {
  // Advance stage to consultation
  const patchRes = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'consultation',
      next_action: 'Site measurement scheduled',
      next_follow_up_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    }),
  });
  const patchJson = await patchRes.json();
  assert.equal(patchRes.status, 200);
  assert.equal(patchJson.data.status, 'consultation');

  // Log follow-up call
  const logRes = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}/follow-ups`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: 'call',
      summary: 'Spoke with client about material preferences and preliminary floor plan.',
      next_action: 'Prepare 3D moodboard',
      scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    }),
  });
  const logJson = await logRes.json();
  assert.equal(logRes.status, 201);
  assert.equal(logJson.success, true);
  assert.equal(logJson.data.channel, 'call');
});

test('4. Promote enquiry to Active Client Project', async () => {
  const convRes = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}/convert-to-project`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agreed_budget: 2000000,
    }),
  });
  const convJson = await convRes.json();
  assert.equal(convRes.status, 201);
  assert.equal(convJson.success, true);
  assert.ok(convJson.data.id);

  createdProjectId = convJson.data.id;

  // Verify enquiry status changed to active_project
  const enqRow = (await pool.query('SELECT status FROM enquiries WHERE id = $1', [createdEnquiryId])).rows[0];
  assert.equal(enqRow.status, 'active_project');
});

test('5. Proposal versioning and baseline approval lock', async () => {
  // 1. Create Proposal (starts with version 1)
  const propRes = await fetch(`${baseUrl}/api/admin/client-projects/${createdProjectId}/proposals`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Initial Concept & Architectural Drawings',
      scope_summary: 'Full layout drawings, MEP, lighting fixtures, custom veneer woodwork.',
      proposed_cost: 1800000,
      timeline_days: 45,
      documents: [{ name: 'boq_v1.pdf', url: 'https://example.com/boq_v1.pdf' }],
    }),
  });
  const propJson = await propRes.json();
  assert.equal(propRes.status, 201);
  createdProposalId = propJson.data.id;
  assert.equal(propJson.data.status, 'draft');
  assert.equal(propJson.data.version.version, 1);

  // 2. Add revised Proposal Version 2
  const v2Res = await fetch(`${baseUrl}/api/admin/proposals/${createdProposalId}/versions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scope_summary: 'Revised scope including acoustic ceiling panels in home theater.',
      proposed_cost: 1950000,
      timeline_days: 50,
      documents: [{ name: 'boq_v2.pdf', url: 'https://example.com/boq_v2.pdf' }],
    }),
  });
  const v2Json = await v2Res.json();
  assert.equal(v2Res.status, 201);
  assert.equal(v2Json.data.version, 2);

  // 3. Approve Version 2
  const appRes = await fetch(`${baseUrl}/api/admin/proposals/${createdProposalId}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 2,
      approval_notes: 'Client signed revised estimate in office.',
    }),
  });
  const appJson = await appRes.json();
  assert.equal(appRes.status, 200);
  assert.equal(appJson.data.proposal.status, 'approved');
  assert.equal(appJson.data.proposal.approved_version, 2);

  // Verify client_projects table updated agreed_budget to version 2 cost (1,950,000)
  const projRow = (await pool.query('SELECT agreed_budget, stage FROM client_projects WHERE id = $1', [createdProjectId])).rows[0];
  assert.equal(Number(projRow.agreed_budget), 1950000);
  assert.equal(projRow.stage, 'approved');
});

test('6. Change Orders are segregated from baseline proposal budget', async () => {
  // 1. Submit Change Order
  const coRes = await fetch(`${baseUrl}/api/admin/client-projects/${createdProjectId}/change-orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Smart Home Automation Package',
      description: 'Centralized smart lighting controllers and automated window blinds in master suite.',
      proposed_cost: 145000,
      timeline_impact_days: 5,
    }),
  });
  const coJson = await coRes.json();
  assert.equal(coRes.status, 201);
  assert.equal(coJson.data.status, 'pending_approval');
  createdChangeOrderId = coJson.data.id;

  // Verify agreed_budget in client_projects is still untouched at 1,950,000 (from approved proposal v2)
  const projRowBefore = (await pool.query('SELECT agreed_budget FROM client_projects WHERE id = $1', [createdProjectId])).rows[0];
  assert.equal(Number(projRowBefore.agreed_budget), 1950000);

  // 2. Decide / Approve Change Order
  const decRes = await fetch(`${baseUrl}/api/admin/change-orders/${createdChangeOrderId}/decision`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'approved',
      client_notes: 'Approved via WhatsApp confirmation from client.',
    }),
  });
  const decJson = await decRes.json();
  assert.equal(decRes.status, 200);
  assert.equal(decJson.data.status, 'approved');
  assert.ok(decJson.data.decided_at);
});

test('7. Client handling dashboard returns correct operational statistics', async () => {
  const dashRes = await fetch(`${baseUrl}/api/admin/client-handling/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dashJson = await dashRes.json();
  assert.equal(dashRes.status, 200);
  assert.equal(dashJson.success, true);
  assert.ok(dashJson.data.pipeline);
  assert.ok(Array.isArray(dashJson.data.needsAttention.overdueFollowUps));
  assert.ok(Array.isArray(dashJson.data.needsAttention.pendingChangeOrders));
});

after(async () => {
  try {
    if (createdProjectId) {
      await pool.query('DELETE FROM change_orders WHERE project_id = $1', [createdProjectId]);
      await pool.query('DELETE FROM proposal_versions WHERE proposal_id IN (SELECT id FROM proposals WHERE project_id = $1)', [createdProjectId]);
      await pool.query('DELETE FROM proposals WHERE project_id = $1', [createdProjectId]);
      await pool.query('DELETE FROM client_projects WHERE id = $1', [createdProjectId]);
    }
    if (createdEnquiryId) {
      await pool.query('DELETE FROM enquiry_follow_ups WHERE enquiry_id = $1', [createdEnquiryId]);
      await pool.query('DELETE FROM enquiries WHERE id = $1', [createdEnquiryId]);
    }
    if (createdClientId) {
      await pool.query('DELETE FROM clients WHERE id = $1', [createdClientId]);
    }
    await pool.query('DELETE FROM clients WHERE phone = $1', [TEST_PHONE]);
  } catch (err) {
    console.error('Test cleanup error:', err.message);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end().catch(() => {});
  }
});
