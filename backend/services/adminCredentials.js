const { pool } = require('../db');
async function getCredentials(db = pool) {
  const result = await db.query('SELECT password_hash, version FROM admin_credentials WHERE id = 1');
  if (!result.rows[0]) throw new Error('Admin credentials are not initialized');
  return result.rows[0];
}
async function setPassword(hash, db = pool, expectedVersion) {
  const result = await db.query(`WITH changed AS (
    UPDATE admin_credentials SET password_hash = $1, version = version + 1
    WHERE id = 1 AND ($2::integer IS NULL OR version = $2) RETURNING version
  ), invalidated AS (
    UPDATE admin_password_resets SET used = true WHERE used = false AND EXISTS (SELECT 1 FROM changed)
  ) SELECT version FROM changed`, [hash, expectedVersion ?? null]);
  if (!result.rowCount) throw new Error('Credentials changed; please sign in again');
}

function parseUserAgent(ua) {
  if (!ua || typeof ua !== 'string') return 'Unknown Device';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua)) browser = 'Apple Safari';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  return `${browser} on ${os}`;
}

function formatDateBST(date = new Date()) {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date);
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const utcStr = validDate.toUTCString();
  const bstStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(validDate) + ' BST';
  return { bstStr, utcStr };
}

module.exports = { getCredentials, setPassword, parseUserAgent, formatDateBST };
