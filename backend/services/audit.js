const { pool } = require('../db');
async function audit(req, action, entityType, entityId, beforeData, afterData, db = pool) {
  await db.query(`INSERT INTO audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data, ip_address, request_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [req.admin?.sub || null, action, entityType || null, entityId == null ? null : String(entityId), beforeData || null, afterData || null, req.ip, req.id]);
}
async function snapshot(entityType, entityId, data, actorId, db = pool) {
  if (!entityType || entityId == null || !data) return;
  await db.query(`INSERT INTO content_versions(entity_type, entity_id, version, snapshot, actor_id)
    SELECT $1,$2,COALESCE(MAX(version),0)+1,$3,$4 FROM content_versions WHERE entity_type=$1 AND entity_id=$2`, [entityType, entityId, data, actorId || null]);
}
module.exports = { audit, snapshot };

