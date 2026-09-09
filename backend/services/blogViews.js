const { pool } = require('../db');
const pending = new Map();
function recordView(id) {
  if (pending.has(id) || pending.size < 1000) pending.set(id, (pending.get(id) || 0) + 1);
}
async function flushViews() {
  const batch = [...pending];
  pending.clear();
  if (!batch.length) return;
  // Aggregate updates reduce contention on popular blog rows. Counts are best effort.
  await pool.query(`UPDATE blog_posts AS posts SET views_count = COALESCE(views_count, 0) + batch.count
    FROM UNNEST($1::integer[], $2::integer[]) AS batch(id, count) WHERE posts.id = batch.id`,
  [batch.map(([id]) => id), batch.map(([, count]) => count)]);
}
module.exports = { recordView, flushViews };
