// PM2 Process Manager Configuration for Bangla Sketch Production Deployment
// Backend: Django REST Framework with Gunicorn on port 5000
// Frontend: Next.js Production Server on port 3000
// Usage:
//   npx pm2 start ecosystem.config.js
//   npx pm2 save
//   npx pm2 startup

module.exports = {
  apps: [
    {
      name: "banglasketch-backend",
      cwd: "./django_backend",
      script: "./.venv/bin/gunicorn",
      args: "config.wsgi:application --bind 127.0.0.1:5000 --workers 2 --timeout 75",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        DJANGO_SETTINGS_MODULE: "config.settings.production",
        PORT: 5000,
      },
    },
    {
      name: "banglasketch-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        TRUST_INGRESS_IP: "true",
      },
    },
    {
      name: "banglasketch-email-worker",
      cwd: "./django_backend",
      script: "./.venv/bin/python",
      args: "manage.py run_email_worker",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env: {
        DJANGO_SETTINGS_MODULE: "config.settings.production",
      },
    },
    {
      name: "banglasketch-scheduler",
      cwd: "./django_backend",
      script: "./.venv/bin/python",
      args: "manage.py run_jobs",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "150M",
      env: {
        DJANGO_SETTINGS_MODULE: "config.settings.production",
      },
    },
  ],
};
