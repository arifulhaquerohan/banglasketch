const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
// Never use deployment credentials or send real mail in this suite.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://banglasketch_test@127.0.0.1:55439/postgres';
if (!['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname)) throw new Error('Tests require an isolated local database');
process.env.ADMIN_JWT_SECRET = 'test-only-secret-that-is-never-used-in-production';
process.env.ADMIN_RECOVERY_EMAIL = 'admin@example.test';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
const bcrypt = require('bcryptjs');
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('initial-password', 4);
const { app, pool, initDB } = require('../server');
const { PostgresStore } = require('../middleware/rateLimit');
const { deliverOne } = require('../services/contactQueue');
const { flushViews } = require('../services/blogViews');
let server, base;
async function request(path, body, token) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
async function requestMethod(method, path, body, token) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
before(async () => {
  await initDB();
  await pool.query('TRUNCATE admin_password_resets, rate_limit_counters, contact_submissions, projects, blog_posts CASCADE');
  await pool.query('UPDATE admin_credentials SET password_hash = $1, version = 1', [process.env.ADMIN_PASSWORD_HASH]);
  await pool.query("UPDATE admin_users SET password_hash=$1,token_version=1,active=true,totp_enabled=false WHERE email='admin@example.test'", [process.env.ADMIN_PASSWORD_HASH]);
  await pool.query('TRUNCATE audit_logs, content_versions, background_jobs, login_history RESTART IDENTITY');
  await pool.query("DELETE FROM admin_users WHERE email<>'admin@example.test'");
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); await pool.end(); });
test('password changes persist and revoke old JWTs', async () => {
  const login = await request('/admin/login', { password: 'initial-password' });
  assert.equal(login.status, 200);
  assert.equal((await request('/admin/verify', undefined, login.body.token)).status, 200);
  await pool.query("INSERT INTO admin_password_resets (email, otp_hash, expires_at) VALUES ('admin@example.test', 'unused-hash', NOW() + INTERVAL '10 minutes')");
  const changed = await request('/admin/change-password', { currentPassword: 'initial-password', newPassword: 'changed-password' }, login.body.token);
  assert.equal(changed.status, 200);
  assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM admin_password_resets WHERE used = false")).rows[0].count, 0);
  assert.equal((await request('/admin/verify', undefined, login.body.token)).status, 401);
  assert.equal((await request('/admin/login', { password: 'initial-password' })).status, 401);
  assert.equal((await request('/admin/login', { password: 'changed-password' })).status, 200);
  const row = (await pool.query("SELECT password_hash,token_version AS version FROM admin_users WHERE email='admin@example.test'")).rows[0];
  assert.ok(await bcrypt.compare('changed-password', row.password_hash));
  assert.equal(row.version, 2);
});
test('rate counters are atomic and shared between process stores', async () => {
  const a = new PostgresStore('test'), b = new PostgresStore('test');
  a.init({ windowMs: 60000 }); b.init({ windowMs: 60000 });
  const results = await Promise.all(Array.from({ length: 30 }, (_, i) => (i % 2 ? a : b).increment('client')));
  assert.deepEqual(results.map(r => r.totalHits).sort((a,b) => a-b), Array.from({length:30},(_,i)=>i+1));
  await pool.query("UPDATE rate_limit_counters SET expires_at = NOW() - INTERVAL '1 second' WHERE key = 'test:client'");
  assert.equal((await b.increment('client')).totalHits, 1);
});
test('pagination stays bounded and excludes unpublished data', async () => {
  for (let i = 0; i < 5; i++) await pool.query('INSERT INTO projects (title, slug, category, published) VALUES ($1, $2, $3, $4)', ['Project '+i,'project-'+i,'kitchen',i !== 4]);
  const first = await request('/projects?limit=2');
  const second = await request('/projects?limit=2&page=2');
  assert.equal(first.body.data.length, 2);
  assert.equal(first.body.pagination.hasMore, true);
  assert.equal(second.body.pagination.hasMore, false);
  assert.equal(new Set([...first.body.data,...second.body.data].map(p=>p.id)).size, 4);
  assert.equal((await request('/projects?limit=1000')).status, 400);
  assert.equal((await request('/projects?category[x]=bad')).status, 400);
  assert.equal((await request('/projects/project-4')).status, 404);
});
test('contact and queue commit together; delivery is claimed once and retries failure', async () => {
  const response = await request('/contact', {name:'Test',email:'visitor@example.test',message:'Test inquiry'});
  assert.equal(response.status, 201);
  assert.equal((await pool.query('SELECT * FROM contact_email_jobs WHERE submission_id = $1',[response.body.id])).rowCount, 2);
  const deliveries = [];
  const sender = {sendContactNotification: async s=>{deliveries.push('notification');},sendClientConfirmation: async s=>{deliveries.push('confirmation');}};
  await Promise.all([deliverOne(sender),deliverOne(sender),deliverOne(sender)]);
  assert.deepEqual(deliveries.sort(), ['confirmation','notification']);
  await pool.query('UPDATE contact_email_jobs SET delivered_at = NULL, available_at = NOW(), attempts = 0 WHERE kind = $1',['notification']);
  await deliverOne({sendContactNotification:async()=>{throw new Error('Simulated SMTP failure');}});
  const retry = (await pool.query("SELECT * FROM contact_email_jobs WHERE kind = 'notification'")).rows[0];
  assert.equal(retry.delivered_at, null);
  assert.equal(retry.attempts, 1);
  assert.ok(retry.available_at > new Date());
});
test('concurrent OTP guesses cannot exceed five comparisons', async () => {
  await pool.query('INSERT INTO admin_password_resets (email, otp_hash, expires_at, ip_address) VALUES ($1,$2,NOW()+INTERVAL \'10 minutes\',$3)', ['admin@example.test',await bcrypt.hash('123456',4),'127.0.0.1']);
  await Promise.all(Array.from({length:8},()=>request('/admin/verify-reset-otp',{email:'admin@example.test',otp:'999999',newPassword:'reset-password'})));
  const row = (await pool.query('SELECT * FROM admin_password_resets ORDER BY id DESC LIMIT 1')).rows[0];
  assert.equal(row.attempts,5);
});
test('OTP consumption and password change are atomic under concurrent requests', async () => {
  await pool.query('UPDATE admin_password_resets SET used = true');
  await pool.query('INSERT INTO admin_password_resets (email, otp_hash, expires_at, ip_address) VALUES ($1,$2,NOW()+INTERVAL \'10 minutes\',$3)', ['admin@example.test',await bcrypt.hash('123456',4),'127.0.0.1']);
  const results = await Promise.all(Array.from({length:2},()=>request('/admin/verify-reset-otp',{email:'admin@example.test',otp:'123456',newPassword:'reset-password'})));
  assert.equal(results.filter(r=>r.status===200).length,1);
  assert.equal((await request('/admin/login',{password:'reset-password'})).status,200);
});
test('blog views flush in a batch and drafts stay private', async () => {
  await pool.query("INSERT INTO blog_posts (title,slug,published) VALUES ('Public','public',true),('Draft','draft',false)");
  assert.equal((await request('/blog/public')).status,200);
  assert.equal((await request('/blog/public')).status,200);
  assert.equal((await request('/blog/draft')).status,404);
  await flushViews();
  assert.equal((await pool.query("SELECT views_count FROM blog_posts WHERE slug='public'")).rows[0].views_count,2);
});
test('trusted proxy forwarding separates clients instead of sharing form limits', async () => {
  const send = async (ip) => {
    const response = await fetch(base + '/newsletter', {method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':ip},body:JSON.stringify({email:'rate-limit@example.test'})});
    return response.status;
  };
  for (let i=0;i<10;i++) assert.equal(await send('192.0.2.10'),201);
  assert.equal(await send('192.0.2.10'),429);
  assert.equal(await send('192.0.2.11'),201);
});
test('concurrent public requests complete without database errors', async () => {
  const started = performance.now();
  const results = await Promise.all(Array.from({length:50},(_,i)=>fetch(base+'/projects?limit=2',{headers:{'X-Forwarded-For':`198.51.100.${i+1}`}})));
  assert.ok(results.every(r=>r.status===200));
  for (const response of results) assert.equal((await response.json()).data.length,2);
  console.log(`50 concurrent local list requests completed in ${Math.round(performance.now()-started)}ms (smoke test, not production capacity).`);
});
test('updated mail library can construct messages without network delivery', async () => {
  const transport = require('nodemailer').createTransport({streamTransport:true,buffer:true,newline:'unix'});
  const result = await transport.sendMail({from:'sender@example.test',to:'receiver@example.test',subject:'Banglasketch confirmation',html:'<p>Thank you</p>'});
  assert.match(result.message.toString(),/Banglasketch confirmation/);
  transport.close();
});
test('validated CRUD writes audit history, versions, soft deletes, and restores', async () => {
  const login = await request('/admin/login', {password:'reset-password'});
  assert.equal((await request('/admin/projects',{title:'Bad',slug:'BAD!',category:'invalid'},login.body.token)).status,400);
  const created = await request('/admin/projects',{title:'Audited project',slug:'audited-project',category:'kitchen',description:'Original'},login.body.token);
  assert.equal(created.status,201);
  const id=created.body.data.id;
  const updated=await requestMethod('PUT',`/admin/projects/${id}`,{description:'Updated'},login.body.token);
  assert.equal(updated.status,200);
  assert.equal((await requestMethod('DELETE',`/admin/projects/${id}`,undefined,login.body.token)).status,200);
  assert.equal((await request('/projects/audited-project')).status,404);
  const versions=await request(`/admin/versions/projects/${id}`,undefined,login.body.token);
  assert.ok(versions.body.data.length>=3);
  assert.equal((await request(`/admin/restore/projects/${id}`,{},login.body.token)).status,200);
  assert.equal((await request('/projects/audited-project')).status,200);
  const audit=(await pool.query("SELECT action FROM audit_logs WHERE entity_type='projects' AND entity_id=$1",[String(id)])).rows.map(row=>row.action);
  assert.ok(['create','update','soft_delete','restore'].every(action=>audit.includes(action)));
});
test('roles restrict mutations and optional TOTP protects login', async () => {
  const owner=await request('/admin/login',{password:'reset-password'});
  const viewer=await request('/admin/users',{email:'viewer@example.test',display_name:'Viewer',password:'viewer-password',role:'viewer'},owner.body.token);
  assert.equal(viewer.status,201);
  const viewerLogin=await request('/admin/login',{email:'viewer@example.test',password:'viewer-password'});
  assert.equal(viewerLogin.status,200);
  assert.equal((await request('/admin/projects',{title:'Forbidden',slug:'forbidden',category:'kitchen'},viewerLogin.body.token)).status,403);
  const setup=await request('/admin/2fa/setup',{},owner.body.token);
  const { authenticator }=require('otplib');
  const code=authenticator.generate(setup.body.data.secret);
  assert.equal((await request('/admin/2fa/enable',{code},owner.body.token)).status,200);
  const challenge=await request('/admin/login',{password:'reset-password'});
  assert.equal(challenge.status,401); assert.equal(challenge.body.requiresTotp,true);
  assert.equal((await request('/admin/login',{password:'reset-password',totp:authenticator.generate(setup.body.data.secret)})).status,200);
});
test('v1 routes, cursor pagination, jobs and protected metrics work', async () => {
  const first=await request('/v1/projects?limit=2');
  assert.equal(first.status,200); assert.ok(first.body.pagination.nextCursor);
  const second=await request(`/v1/projects?limit=2&cursor=${first.body.pagination.nextCursor}`);
  assert.equal(second.status,200);
  assert.equal((await fetch(base.replace('/api','')+'/metrics')).status,401);
  const { runOne, enqueue }=require('../services/jobs');
  await pool.query("INSERT INTO blog_posts(title,slug,published,scheduled_publish_date) VALUES('Scheduled','scheduled',false,NOW()-INTERVAL '1 minute') ON CONFLICT(slug) DO UPDATE SET published=false,scheduled_publish_date=EXCLUDED.scheduled_publish_date");
  await enqueue('publish_scheduled'); await runOne();
  assert.equal((await request('/blog/scheduled')).status,200);
});
