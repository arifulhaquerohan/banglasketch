const crypto = require('crypto');
function key() {
  const value = Buffer.from(process.env.TOTP_ENCRYPTION_KEY || '', 'base64');
  if (value.length !== 32) throw Object.assign(new Error('TOTP encryption is not configured'), { status: 503 });
  return value;
}
function encrypt(value) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
function decrypt(value) {
  const data = Buffer.from(value, 'base64url'); const decipher = crypto.createDecipheriv('aes-256-gcm', key(), data.subarray(0,12));
  decipher.setAuthTag(data.subarray(12,28)); return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8');
}
module.exports = { encrypt, decrypt };
