// Supply the new password through stdin to avoid command-line/history exposure.
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('../server');
const { setPassword } = require('../services/adminCredentials');
(async () => {
  const password = fs.readFileSync(0, 'utf8').replace(/\r?\n$/, '');
  if (password.length < 8 || Buffer.byteLength(password) > 72) throw new Error('Password must be at least 8 characters and at most 72 bytes');
  await initDB();
  const hash = await bcrypt.hash(password, 12);
  await pool.query('INSERT INTO admin_credentials (id, password_hash) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [hash]);
  await setPassword(hash);
  const email = (process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || 'admin@localhost').trim().toLowerCase();
  await pool.query('UPDATE admin_users SET password_hash=$1,token_version=token_version+1,updated_at=NOW() WHERE email=$2', [hash, email]);
  console.log('Admin password updated; previous sessions revoked.');
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => pool.end());
