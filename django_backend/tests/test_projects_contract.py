"""Compare the public Django API directly with Express on a disposable PostgreSQL DB."""
import json
import os
from pathlib import Path
import subprocess
from unittest import skipUnless
from urllib.parse import quote

from django.db import connection
from django.test import LiveServerTestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.authentication.models import AdminUser
from apps.projects.models import Project


@skipUnless(connection.vendor == 'postgresql', 'Requires PostgreSQL and pg_trgm')
class ProjectsContractTests(LiveServerTestCase):
    def setUp(self):
        with connection.cursor() as cursor:
            cursor.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')
        self.client = APIClient()
        for i in range(5):
            Project.objects.create(
                title=f'Gulshan Apartment {i}', slug=f'apartment-{i}',
                category='Residential' if i % 2 else 'Commercial',
                description=None if i == 0 else 'Interior design in Dhaka',
                date_completed='2026-09-01', gallery=['https://example.com/photo.jpg'],
                featured=i % 2 == 0,
            )
        Project.objects.create(title='Draft', slug='draft', category='Residential', published=False)
        Project.objects.create(title='Deleted', slug='deleted', category='Residential', deleted_at=timezone.now())

    def test_public_express_parity(self):
        last_id = Project.objects.filter(slug='apartment-4').get().id
        import base64
        cursor = base64.urlsafe_b64encode(str(last_id).encode()).decode().rstrip('=')
        suffixes = ['', '/', '?limit=2', '?page=2&limit=2', '?page=100000',
                    '?category=Residential', '?category=residential', '?category=all',
                    '?featured=true', '?search=Gulshan', '?search=Gulshn',
                    '?search=%25', '?search=%27', '?search=zzzzzzzz',
                    f'?cursor={cursor}&page=9&limit=2',
                    '?limit=0', '?limit=101', '?limit=01', '?page=0', '?page=100001',
                    '?page=1.2', '?page=1&page=2', '?limit=1&limit=2', '?cursor=1',
                    '?cursor=', '?cursor=garbage', '?unknown=1', '?category=a&category=b',
                    '?search=' + 'x' * 201,
                    '/apartment-0', '/apartment-1/', '/draft', '/deleted', '/missing']
        paths = [prefix + suffix for prefix in ('/api/projects', '/api/v1/projects') for suffix in suffixes]
        db = connection.settings_dict
        url = f"postgresql://{quote(db['USER'], safe='')}:{quote(db['PASSWORD'], safe='')}@{db['HOST']}:{db['PORT']}/{db['NAME']}"
        backend = Path(__file__).resolve().parents[2] / 'backend'
        if not backend.exists():
            self.skipTest("backend/ directory has been decommissioned; skipping legacy express parity test")
        script = r'''
const express = require('express');
const { pool } = require('./db');
const app = express();
app.use('/api/projects', require('./routes/projects'));
app.use('/api/v1/projects', require('./routes/projects'));
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.on('listening', resolve));
  try {
    const results = [];
    for (const path of JSON.parse(input)) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`);
      results.push({status: response.status, body: await response.json(), cache: response.headers.get('cache-control')});
    }
    process.stdout.write(JSON.stringify(results));
  } finally { server.close(); await pool.end(); }
});
'''
        result = subprocess.run(['node', '-e', script], cwd=backend,
                                env={**os.environ, 'DATABASE_URL': url},
                                input=json.dumps(paths), text=True, capture_output=True, timeout=40, check=True)
        expected = json.loads(result.stdout)
        for path, reference in zip(paths, expected):
            with self.subTest(path=path):
                response = self.client.get(path, HTTP_AUTHORIZATION='Bearer invalid-ignored-on-public-route')
                self.assertEqual(response.status_code, reference['status'])
                self.assertEqual(response.json(), reference['body'])
                self.assertEqual(response.get('Cache-Control'), reference['cache'])

    def test_viewer_can_read_but_cannot_write(self):
        user = AdminUser.objects.create(email='viewer@example.com', display_name='Viewer', role='viewer', active=True)
        self.client.force_authenticate(user=user)
        self.assertEqual(self.client.get('/api/admin/projects').status_code, 200)
        self.assertEqual(self.client.post('/api/admin/projects', {'title': 'Forbidden'}, format='json').status_code, 403)
        project = Project.objects.first()
        self.assertEqual(self.client.put(f'/api/admin/projects/{project.id}', {'title': 'Forbidden'}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(f'/api/admin/projects/{project.id}').status_code, 403)

    def test_existing_frontend_fetchers(self):
        frontend = Path(__file__).resolve().parents[2] / 'frontend'
        script = r'''
const fs = require('fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  });
  module._compile(output.outputText, filename);
};
const api = require('./lib/api.ts');
(async () => {
  const projects = await api.getProjects();
  assert.equal(projects.length, 5);
  assert.ok(projects.every(project => project.slug.startsWith('apartment-')));
  const filtered = await api.getProjects({ category: 'Residential', search: 'Gulshn' });
  assert.equal(filtered.length, 2);
  const page = await api.getPublicPage('projects', { page: 2, limit: 2 });
  assert.equal(page.data.length, 2);
  assert.equal(page.page, 2);
  assert.equal(page.hasMore, true);
  const detail = await api.getProjectBySlug('apartment-0');
  assert.equal(detail.slug, 'apartment-0');
  assert.deepEqual(detail.gallery, ['https://example.com/photo.jpg']);
  assert.equal(await api.getProjectBySlug('draft'), null);
  assert.equal(await api.getProjectBySlug('deleted'), null);
  process.stdout.write('Frontend project fetching passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
'''
        result = subprocess.run(['node', '-e', script], cwd=frontend,
                                env={**os.environ, 'API_URL': self.live_server_url, 'NODE_ENV': 'production', 'NEXT_PHASE': ''},
                                text=True, capture_output=True, timeout=40)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_reads_existing_express_schema(self):
        baseline = Path(__file__).resolve().parents[2] / 'backend/migrations/001_baseline.sql'
        if not baseline.exists():
            self.skipTest("backend/migrations baseline SQL decommissioned; skipping legacy schema test")
        with connection.cursor() as cursor:
            cursor.execute('CREATE SCHEMA projects_contract_legacy')
            cursor.execute('SET search_path TO projects_contract_legacy, public')
        try:
            with connection.cursor() as cursor:
                cursor.execute(baseline.read_text())
                cursor.execute("INSERT INTO projects (title, slug, category, gallery) VALUES ('Legacy', 'legacy-project', 'Residential', '[\"legacy.jpg\"]')")
            response = self.client.get('/api/projects/legacy-project')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['data']['id'], 1)
            self.assertEqual(response.json()['data']['gallery'], ['legacy.jpg'])
            self.assertIsNone(response.json()['data']['deleted_at'])
        finally:
            with connection.cursor() as cursor:
                cursor.execute('SET search_path TO public')
                cursor.execute('DROP SCHEMA projects_contract_legacy CASCADE')
