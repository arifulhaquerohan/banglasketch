const client = require('prom-client');
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const requests = new client.Counter({ name: 'banglasketch_http_requests_total', help: 'HTTP requests', labelNames: ['method','route','status'], registers: [register] });
const duration = new client.Histogram({ name: 'banglasketch_http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['method','route','status'], registers: [register] });
const poolConnections = new client.Gauge({ name: 'banglasketch_db_pool_connections', help: 'Database pool connections', labelNames: ['state'], registers: [register] });
const jobBacklog = new client.Gauge({ name: 'banglasketch_job_backlog', help: 'Pending work', labelNames: ['queue'], registers: [register] });
function middleware(req, res, next) {
  const stop = duration.startTimer();
  res.on('finish', () => {
    const route = req.baseUrl ? (req.route?.path && req.route.path !== '/' ? `${req.baseUrl}${req.route.path}` : req.baseUrl) : (req.route?.path || 'unknown');
    const labels = { method: req.method, route, status: String(res.statusCode) };
    requests.inc(labels); stop(labels);
  });
  next();
}
async function collectDatabaseMetrics(pool) {
  poolConnections.set({ state: 'total' }, pool.totalCount); poolConnections.set({ state: 'idle' }, pool.idleCount); poolConnections.set({ state: 'waiting' }, pool.waitingCount);
  const { rows } = await pool.query(`SELECT
    (SELECT COUNT(*) FROM background_jobs WHERE status IN ('pending','failed'))::int AS jobs,
    (SELECT COUNT(*) FROM contact_email_jobs WHERE delivered_at IS NULL AND attempts<8)::int AS emails`);
  jobBacklog.set({ queue: 'background' }, rows[0].jobs); jobBacklog.set({ queue: 'email' }, rows[0].emails);
}
module.exports = { register, middleware, collectDatabaseMetrics };
