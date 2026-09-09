const { pool } = require('../db');
const cloudinary = require('./cloudinary');
const handlers = {
  publish_scheduled: async (_payload, db) => {
    const candidate = await db.query(`SELECT id, slug FROM blog_posts WHERE deleted_at IS NULL AND published=false AND scheduled_publish_date<=NOW()`);
    if (!candidate.rowCount) return;

    if (process.env.REVALIDATE_URL && process.env.REVALIDATE_SECRET) {
      try {
        const response = await fetch(process.env.REVALIDATE_URL, { method: 'POST', headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}`, 'content-type': 'application/json' }, body: JSON.stringify({ paths: ['/','/blog'] }), signal: AbortSignal.timeout(5000) });
        if (!response.ok) console.error(`Revalidation warning: server returned ${response.status}`);
      } catch (e) {
        console.error('Revalidation warning:', e.message);
      }
    }

    await db.query(`UPDATE blog_posts SET published=true, published_date=COALESCE(scheduled_publish_date,NOW()), scheduled_publish_date=NULL, updated_at=NOW() WHERE id = ANY($1)`, [candidate.rows.map(r => r.id)]);
  },
  cleanup_cloudinary: async payload => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return;
    }
    if (payload.publicId) await cloudinary.uploader.destroy(payload.publicId, { invalidate: true, resource_type: 'image' });
  },
  purge_operational_data: async (_payload, db) => {
    await db.query("DELETE FROM rate_limit_counters WHERE expires_at < NOW() - INTERVAL '1 hour'");
    await db.query("DELETE FROM admin_password_resets WHERE created_at < NOW() - INTERVAL '30 days'");
    await db.query("DELETE FROM background_jobs WHERE status='completed' AND completed_at < NOW() - INTERVAL '30 days'");
  },
};
async function enqueue(kind, payload = {}, db = pool) { await db.query('INSERT INTO background_jobs(kind,payload) VALUES ($1,$2)', [kind, payload]); }
async function runOne(db = pool) {
  const { rows } = await db.query(`WITH candidate AS (
    SELECT id FROM background_jobs
    WHERE (status IN ('pending','failed') OR (status = 'running' AND locked_at < NOW() - INTERVAL '15 minutes'))
      AND attempts < max_attempts AND available_at <= NOW()
    ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1
  )
    UPDATE background_jobs j SET status='running', attempts=attempts+1, locked_at=NOW() FROM candidate WHERE j.id=candidate.id RETURNING j.*`);
  if (!rows[0]) return false;
  const job = rows[0];
  try {
    const handler = handlers[job.kind];
    if (!handler) throw new Error(`Unknown job: ${job.kind}`);
    await handler(job.payload, db);
    await db.query("UPDATE background_jobs SET status='completed',completed_at=NOW(),locked_at=NULL WHERE id=$1", [job.id]);
  } catch (error) {
    await db.query("UPDATE background_jobs SET status='failed',last_error=$2,locked_at=NULL,available_at=NOW()+LEAST(3600,30*POWER(2,attempts))*INTERVAL '1 second' WHERE id=$1", [job.id, String(error.message).slice(0,1000)]);
  }
  return true;
}
function startWorker() {
  const schedule = setInterval(() => {
    enqueue('publish_scheduled').catch(() => {});
    enqueue('purge_operational_data').catch(() => {});
  }, 60000);
  schedule.unref();
  const work = setInterval(() => runOne().catch(error => console.error('Job worker error:', error.message)), 1000);
  work.unref();
  return () => { clearInterval(schedule); clearInterval(work); };
}
module.exports = { enqueue, runOne, startWorker, handlers };
