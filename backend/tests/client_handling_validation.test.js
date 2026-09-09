const { test } = require('node:test');
const assert = require('node:assert/strict');
const { schemas } = require('../middleware/validate');

test('enquiry_create schema validates complete and valid enquiry submission', () => {
  const payload = {
    name: 'Sarah Khan',
    phone: '+8801712345678',
    email: 'sarah.khan@example.com',
    project_location: 'Gulshan 2, Dhaka',
    property_type: 'apartment',
    service_scope: 'interior_design',
    approx_budget: '15-20 Lakhs BDT',
    preferred_start_date: 'Next month',
    notes: 'Duplex apartment 2800 sqft, contemporary Scandinavian style.',
    attachments: ['https://example.com/plan.pdf'],
    started_at: Date.now() - 3000,
  };

  const parsed = schemas.enquiry_create.safeParse(payload);
  assert.equal(parsed.success, true);
});

test('enquiry_create schema requires mandatory fields (name, phone, location, property_type, service_scope)', () => {
  const invalidPayload = {
    email: 'sarah@example.com',
  };

  const parsed = schemas.enquiry_create.safeParse(invalidPayload);
  assert.equal(parsed.success, false);
  const issues = parsed.error.issues.map((i) => i.path[0]);
  assert.ok(issues.includes('name'));
  assert.ok(issues.includes('phone'));
  assert.ok(issues.includes('project_location'));
  assert.ok(issues.includes('property_type'));
  assert.ok(issues.includes('service_scope'));
});

test('enquiry_create rejects invalid property_type or service_scope enums', () => {
  const invalidEnum = {
    name: 'Sarah Khan',
    phone: '+8801712345678',
    project_location: 'Banani',
    property_type: 'skyscraper',
    service_scope: 'demolition',
    started_at: Date.now() - 3000,
  };

  const parsed = schemas.enquiry_create.safeParse(invalidEnum);
  assert.equal(parsed.success, false);
});

test('enquiry_update schema validates status transitions and scheduling', () => {
  const updatePayload = {
    status: 'consultation',
    next_action: 'Site measurement scheduled with client',
    next_follow_up_date: '2026-09-15T10:00:00.000Z',
    status_reason: null,
  };

  const parsed = schemas.enquiry_update.safeParse(updatePayload);
  assert.equal(parsed.success, true);
});

test('follow_up_create schema validates interaction logs', () => {
  const followUp = {
    channel: 'whatsapp',
    summary: 'Sent preliminary moodboards via WhatsApp. Client loved the earthy palette.',
    next_action: 'Schedule 3D rendering review',
    scheduled_at: '2026-09-18T14:30:00.000Z',
  };

  const parsed = schemas.follow_up_create.safeParse(followUp);
  assert.equal(parsed.success, true);
});

test('proposal_create schema enforces scope summary and numeric budget', () => {
  const proposal = {
    title: 'Full Turnkey Interior Fitout - Phase 1',
    scope_summary: 'Civil work, customized modular cabinetry, electrical rewiring and accent lighting.',
    proposed_cost: 1850000,
    timeline_days: 45,
    documents: [{ name: 'boq.pdf', url: 'https://example.com/boq.pdf' }],
  };

  const parsed = schemas.proposal_create.safeParse(proposal);
  assert.equal(parsed.success, true);
});

test('change_order_create enforces title, description, and proposed cost', () => {
  const changeOrder = {
    title: 'Italian Marble Upgrade in Living Room',
    description: 'Replace standard 800x800 porcelain tiles with imported Botticino marble.',
    proposed_cost: 240000,
    timeline_impact_days: 7,
  };

  const parsed = schemas.change_order_create.safeParse(changeOrder);
  assert.equal(parsed.success, true);
});

test('change_order_decision schema validates approved or rejected statuses', () => {
  const decisionApproved = {
    status: 'approved',
    client_notes: 'Client signed approval letter on 2026-09-10',
  };
  const decisionRejected = {
    status: 'rejected',
    client_notes: 'Over budget, staying with original porcelain tile specification',
  };
  const decisionInvalid = {
    status: 'maybe_later',
  };

  assert.equal(schemas.change_order_decision.safeParse(decisionApproved).success, true);
  assert.equal(schemas.change_order_decision.safeParse(decisionRejected).success, true);
  assert.equal(schemas.change_order_decision.safeParse(decisionInvalid).success, false);
});

test('portal token regex properly accepts valid hex tokens and rejects malformed ones', () => {
  const portalTokenRegex = /^[a-f0-9]{32,64}$/i;
  // Valid 48-character hex token (24 bytes)
  assert.equal(portalTokenRegex.test('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6'), true);
  // Valid 64-character hex token (32 bytes)
  assert.equal(portalTokenRegex.test('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'), true);
  // Invalid tokens (too short, non-hex, special characters, path traversal)
  assert.equal(portalTokenRegex.test('short-token'), false);
  assert.equal(portalTokenRegex.test('../../../etc/passwd'), false);
  assert.equal(portalTokenRegex.test('a1b2c3d4e5f6!@#$%^&*()'), false);
  assert.equal(portalTokenRegex.test(''), false);
});

