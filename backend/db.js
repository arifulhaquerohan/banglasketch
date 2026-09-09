const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
function integer(name, fallback, min = 1) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < min) throw new Error(`Invalid ${name}`);
  return value;
}
const connectionString = process.env.DATABASE_URL;
const url = connectionString ? new URL(connectionString) : null;
const local = url && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
// Remove URL SSL options so they cannot override certificate verification.
if (url) for (const key of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
const pool = new Pool({
  connectionString: url?.toString(),
  ssl: url && !local ? {
    rejectUnauthorized,
    ...(process.env.DB_SSL_CA_FILE ? { ca: fs.readFileSync(process.env.DB_SSL_CA_FILE, 'utf8') } : {})
  } : false,
  max: integer('DB_POOL_MAX', 10),
  connectionTimeoutMillis: integer('DB_CONNECTION_TIMEOUT_MS', 5000),
  idleTimeoutMillis: 30000,
  statement_timeout: integer('DB_STATEMENT_TIMEOUT_MS', 10000),
  query_timeout: integer('DB_QUERY_TIMEOUT_MS', 12000),
  idle_in_transaction_session_timeout: 15000,
});
pool.on('error', (err) => console.error('Idle database connection error:', err.message));
module.exports = { pool };
