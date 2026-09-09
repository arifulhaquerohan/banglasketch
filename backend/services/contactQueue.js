const { pool } = require('../db');
const email = require('./email');
async function saveContact(values) {
  // Submission and both delivery jobs commit together.
  const { rows } = await pool.query(`WITH submission AS (
    INSERT INTO contact_submissions (name, email, phone, service_type, message)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  ), jobs AS (
    INSERT INTO contact_email_jobs (submission_id, kind)
    SELECT submission.id, kind FROM submission CROSS JOIN (VALUES ('notification'), ('confirmation')) AS types(kind)
  ) SELECT id FROM submission`, values);
  return rows[0];
}
async function deliverOne(send = email, db = pool) {
  const { rows } = await db.query(`WITH candidate AS (
    SELECT id FROM contact_email_jobs
    WHERE delivered_at IS NULL AND attempts < 8 AND available_at <= NOW()
    ORDER BY available_at, id FOR UPDATE SKIP LOCKED LIMIT 1
  ) UPDATE contact_email_jobs AS jobs SET attempts = attempts + 1,
    available_at = NOW() + INTERVAL '2 minutes'
    FROM candidate WHERE jobs.id = candidate.id RETURNING jobs.*`);
  if (!rows.length) return false;
  const job = rows[0];
  try {
    const result = await db.query('SELECT * FROM contact_submissions WHERE id = $1', [job.submission_id]);
    if (result.rows[0]) {
      const outcome = await (job.kind === 'notification' ? send.sendContactNotification : send.sendClientConfirmation)(result.rows[0]);
      if (outcome?.skipped) throw new Error('Mail delivery is not configured');
    }
    await db.query('UPDATE contact_email_jobs SET delivered_at = NOW() WHERE id = $1 AND attempts = $2', [job.id, job.attempts]);
  } catch (err) {
    console.error('Contact email delivery failed:', err.message);
    await db.query("UPDATE contact_email_jobs SET available_at = NOW() + $2 * INTERVAL '1 second' WHERE id = $1 AND attempts = $3", [job.id, Math.min(3600, 30 * 2 ** job.attempts), job.attempts]);
  }
  return true;
}
function startWorker() {
  let stopped = false;
  let active = Promise.resolve();
  const timer = setInterval(() => {
    if (stopped || !email.canSendMail()) return;
    stopped = true;
    active = deliverOne().catch(err => console.error('Email worker error:', err.message)).finally(() => { stopped = false; });
  }, 1000);
  timer.unref();
  return async () => { clearInterval(timer); await active; };
}
module.exports = { saveContact, deliverOne, startWorker };
