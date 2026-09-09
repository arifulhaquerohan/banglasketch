const rateLimit = require('express-rate-limit');
const { pool } = require('../db');
// Atomic counters shared by every application process, using the existing database.
class PostgresStore {
  constructor(prefix) { this.prefix = prefix; }
  init(options) { this.windowMs = options.windowMs; }
  async increment(key) {
    const { rows } = await pool.query(`INSERT INTO rate_limit_counters (key, hits, expires_at)
      VALUES ($1, 1, NOW() + $2 * INTERVAL '1 millisecond')
      ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN rate_limit_counters.expires_at <= NOW() THEN 1 ELSE rate_limit_counters.hits + 1 END,
      expires_at = CASE WHEN rate_limit_counters.expires_at <= NOW() THEN EXCLUDED.expires_at ELSE rate_limit_counters.expires_at END
      RETURNING hits, expires_at`, [this.prefix + ':' + key, this.windowMs]);
    return { totalHits: rows[0].hits, resetTime: rows[0].expires_at };
  }
  async decrement(key) { await pool.query('UPDATE rate_limit_counters SET hits = GREATEST(0, hits - 1) WHERE key = $1', [this.prefix + ':' + key]); }
  async resetKey(key) { await pool.query('DELETE FROM rate_limit_counters WHERE key = $1', [this.prefix + ':' + key]); }
}
function sharedRateLimit(prefix, options) {
  return rateLimit({ ...options, store: new PostgresStore(prefix) });
}
module.exports = { sharedRateLimit, PostgresStore };
